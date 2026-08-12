// This file is required for Expo/React Native SQLite migrations - https://orm.drizzle.team/quick-sqlite/expo

import m0000 from "./0000_ordinary_tomas.sql";
import m0001 from "./0001_flimsy_wonder_man.sql";
import m0002 from "./0002_flowery_nightshade.sql";
import m0003 from "./0003_milky_titania.sql";
import m0004 from "./0004_aberrant_elektra.sql";
import m0005 from "./0005_secret_lenny_balinger.sql";
import m0006 from "./0006_plain_marrow.sql";
import journal from "./meta/_journal.json";

export default {
  journal,
  migrations: {
    m0000,
    m0001,
    m0002,
    m0003,
    m0004,
    m0005,
    m0006,
  },
};
