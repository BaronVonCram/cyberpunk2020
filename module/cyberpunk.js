import { CyberpunkActor } from "./actor/actor.js";
import { CyberpunkActorSheet } from "./actor/actor-sheet.js";
import { CyberpunkItem } from "./item/item.js";
import { CyberpunkItemSheet } from "./item/item-sheet.js";

import { preloadHandlebarsTemplates } from "./templates.js";
import { registerHandlebarsHelpers } from "./handlebars-helpers.js"
import * as migrations from "./migrate.js";
import { registerSystemSettings } from "./settings.js"

Hooks.once('init', async function () {

    // Place classes in system namespace for later reference.
    game.cyberpunk = {
        CyberpunkActor,
        CyberpunkItem,
    };

    // Define custom Entity classes
    CONFIG.Actor.entityClass = CyberpunkActor;
    CONFIG.Item.entityClass = CyberpunkItem;

    // Register sheets, unregister original core sheets
    Actors.unregisterSheet("core", ActorSheet);
    Actors.registerSheet("cyberpunk", CyberpunkActorSheet, { makeDefault: true });
    Items.unregisterSheet("core", ItemSheet);
    Items.registerSheet("cyberpunk", CyberpunkItemSheet, { makeDefault: true });

    // Register System Settings
    registerSystemSettings();

    registerHandlebarsHelpers();

    // Register and preload templates with Foundry. See templates.js for usage
    preloadHandlebarsTemplates();
});

/**
 * Once the entire VTT framework is initialized, check to see if we should perform a data migration (nabbed from Foundry's 5e module and adapted)
 */
 Hooks.once("ready", function() {
    // Determine whether a system migration is required and feasible
    if ( !game.user.isGM ) return;
    const lastMigrateVersion = game.settings.get("cyberpunk", "systemMigrationVersion");
    // First time we're readying, no migrate needed
    if(!lastMigrateVersion) {
        game.settings.set("cyberpunk", "systemMigrationVersion", game.system.data.version);
        return;
    }
    const NEEDS_MIGRATION_VERSION = "0.1.3";
    const needsMigration = lastMigrateVersion && isNewerVersion(NEEDS_MIGRATION_VERSION, lastMigrateVersion);
    if ( !needsMigration ) return;
    migrations.migrateWorld();
  });