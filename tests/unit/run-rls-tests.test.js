import { describe, expect, it } from 'vitest';
import {
  buildPsqlInvocation,
  getPsqlFailureDiagnostic,
  getRlsConnectionAdvisory,
  validateRlsTestEnvironment,
} from '../../scripts/run-rls-tests.mjs';

const stagingEnv = {
  ENVIRONMENT: 'staging',
  SUPABASE_STAGING_PROJECT_REF: 'wzwjjjajmyfwvspxysjb',
  SUPABASE_DB_URL: 'postgresql://postgres.wzwjjjajmyfwvspxysjb:secret@aws-0-region.pooler.supabase.com:5432/postgres?sslmode=require',
};

describe('run-rls-tests guardrails', () => {
  it('accepts a staging database URL that matches the staging project ref', () => {
    const result = validateRlsTestEnvironment(stagingEnv);

    expect(result.ok).toBe(true);
    expect(result.environment).toBe('staging');
    expect(result.connectionMode).toBe('session_pooler');
  });

  it('accepts DATABASE_URL as a fallback when SUPABASE_DB_URL is absent', () => {
    const result = validateRlsTestEnvironment({
      ENVIRONMENT: 'staging',
      SUPABASE_STAGING_PROJECT_REF: 'wzwjjjajmyfwvspxysjb',
      DATABASE_URL: stagingEnv.SUPABASE_DB_URL,
    });

    expect(result.ok).toBe(true);
  });

  it('reports missing database variables by name only', () => {
    const result = validateRlsTestEnvironment({
      ENVIRONMENT: 'staging',
      SUPABASE_STAGING_PROJECT_REF: 'wzwjjjajmyfwvspxysjb',
    });

    expect(result).toMatchObject({
      ok: false,
      code: 'BLOCKED_MISSING_ENV',
      missing: ['SUPABASE_DB_URL or DATABASE_URL'],
    });
  });

  it('blocks production-like environments and database URLs', () => {
    const result = validateRlsTestEnvironment({
      ENVIRONMENT: 'production',
      SUPABASE_STAGING_PROJECT_REF: 'wzwjjjajmyfwvspxysjb',
      SUPABASE_DB_URL: 'postgresql://postgres:secret@prod.example.com/postgres',
    });

    expect(result.ok).toBe(false);
    expect(result.code).toBe('BLOCKED_UNSAFE_ENVIRONMENT');
  });

  it('blocks staging URLs that do not include the staging project ref', () => {
    const result = validateRlsTestEnvironment({
      ENVIRONMENT: 'staging',
      SUPABASE_STAGING_PROJECT_REF: 'wzwjjjajmyfwvspxysjb',
      SUPABASE_DB_URL: 'postgresql://postgres:secret@staging-db.example.com:5432/postgres',
    });

    expect(result.ok).toBe(false);
    expect(result.code).toBe('BLOCKED_STAGING_REF_MISMATCH');
  });

  it('identifies direct Supabase hosts and recommends the Session Pooler', () => {
    const result = validateRlsTestEnvironment({
      ENVIRONMENT: 'staging',
      SUPABASE_STAGING_PROJECT_REF: 'wzwjjjajmyfwvspxysjb',
      SUPABASE_DB_URL: 'postgresql://postgres:secret@db.wzwjjjajmyfwvspxysjb.supabase.co:5432/postgres?sslmode=require',
    });

    expect(result.ok).toBe(true);
    expect(result.connectionMode).toBe('direct');
    expect(getRlsConnectionAdvisory(result)).toContain('RLS_DIRECT_HOST_DETECTED');
  });

  it('blocks pooler URLs that do not use postgres.<PROJECT_REF> as the username', () => {
    const result = validateRlsTestEnvironment({
      ENVIRONMENT: 'staging',
      SUPABASE_STAGING_PROJECT_REF: 'wzwjjjajmyfwvspxysjb',
      SUPABASE_DB_URL: 'postgresql://postgres:secret@aws-0-region.pooler.supabase.com:5432/postgres?sslmode=require',
    });

    expect(result.ok).toBe(false);
    expect(result.code).toBe('BLOCKED_POOLER_USER_FORMAT');
  });

  it('allows local mode only against localhost database hosts', () => {
    const localResult = validateRlsTestEnvironment({
      ENVIRONMENT: 'local',
      DATABASE_URL: 'postgresql://postgres:postgres@127.0.0.1:54322/postgres',
    });
    const remoteResult = validateRlsTestEnvironment({
      ENVIRONMENT: 'local',
      DATABASE_URL: 'postgresql://postgres:postgres@remote.example.com:5432/postgres',
    });

    expect(localResult.ok).toBe(true);
    expect(remoteResult.ok).toBe(false);
    expect(remoteResult.code).toBe('BLOCKED_LOCAL_DB_HOST');
  });

  it('does not pass the database URL as a psql command argument', () => {
    const invocation = buildPsqlInvocation(stagingEnv.SUPABASE_DB_URL, {});

    expect(invocation.command.toLowerCase()).toMatch(/psql(\.exe)?$/);
    expect(invocation.args).not.toContain(stagingEnv.SUPABASE_DB_URL);
    expect(invocation.args).toEqual(['-v', 'ON_ERROR_STOP=1', '-f', 'tests/rls/rls-policies.sql']);
    expect(invocation.env.PGPASSWORD).toBe('secret');
    expect(invocation.env.PGHOST).toBe('aws-0-region.pooler.supabase.com');
    expect(invocation.env.PGPORT).toBe('5432');
    expect(invocation.env.PGCONNECT_TIMEOUT).toBe('10');
  });

  it('diagnoses direct-host connection timeouts without exposing the database URL', () => {
    const validation = validateRlsTestEnvironment({
      ENVIRONMENT: 'staging',
      SUPABASE_STAGING_PROJECT_REF: 'wzwjjjajmyfwvspxysjb',
      SUPABASE_DB_URL: 'postgresql://postgres:secret@db.wzwjjjajmyfwvspxysjb.supabase.co:5432/postgres?sslmode=require',
    });

    const diagnostic = getPsqlFailureDiagnostic({
      status: 1,
      stderr: 'fallo la conexion al servidor en "db.wzwjjjajmyfwvspxysjb.supabase.co", puerto 5432: tiempo de espera agotado',
    }, validation);

    expect(diagnostic).toContain('BLOCKED_SUPABASE_DIRECT_CONNECTIVITY');
    expect(diagnostic).not.toContain('postgresql://');
    expect(diagnostic).not.toContain('secret');
  });

  it('diagnoses authentication failures separately from network failures', () => {
    const validation = validateRlsTestEnvironment(stagingEnv);
    const diagnostic = getPsqlFailureDiagnostic({
      status: 1,
      stderr: 'FATAL: password authentication failed for user "postgres.wzwjjjajmyfwvspxysjb"',
    }, validation);

    expect(diagnostic).toContain('BLOCKED_SUPABASE_AUTH');
  });
});
