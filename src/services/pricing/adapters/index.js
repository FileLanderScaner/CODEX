import { chileOdepaAdapter } from './chile-odepa.js';
import { colombiaSipsaAdapter } from './colombia-sipsa.js';
import { mexicoProfecoAdapter } from './mexico-profeco.js';
import { uruguayUamAdapter } from './uruguay-uam.js';

export const adapters = {
  [uruguayUamAdapter.code]: uruguayUamAdapter,
  [chileOdepaAdapter.code]: chileOdepaAdapter,
  [colombiaSipsaAdapter.code]: colombiaSipsaAdapter,
  [mexicoProfecoAdapter.code]: mexicoProfecoAdapter,
};
