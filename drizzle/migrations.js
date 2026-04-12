// This file is required for Expo/React Native SQLite migrations - https://orm.drizzle.team/quick-sqlite/expo

import m0000 from "./0000_ordinary_tomas.sql";
import m0001 from "./0001_flimsy_wonder_man.sql";
import m0002 from "./0002_flowery_nightshade.sql";
import m0003 from "./0003_milky_titania.sql";
import journal from "./meta/_journal.json";

export default {
  journal,
  migrations: {
    m0000,
    m0001,
    m0002,
    m0003,
  },
};
