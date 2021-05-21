import { CyberpunkActor } from "./actor/actor.js";
import { CyberpunkActorSheet } from "./actor/actor-sheet.js";
import { CyberpunkItem } from "./item/item.js";
import { CyberpunkItemSheet } from "./item/item-sheet.js";

import { preloadHandlebarsTemplates } from "./templates.js";
import { registerHandlebarsHelpers } from "./handlebars-helpers.js"
import * as migrations from "./migrate.js";
import { registerSystemSettings } from "./settings.js"
import { localize } from "./utils.js";

// TODO: The skills as embedded entities will change in 0.8.x, should write for that
function makeSkillsCompendium(compendiumName) {
    const pack = game.packs.get(compendiumName);
    const templateSkills = Object.entries(game.system.template.Actor.templates.skills.skills);

    // Get newskill data from template entry
    function skillData(name, skill) {
        return {name: name, type: "skill", data: {
            flavor: "",
            notes: "",
            value: skill.value || 0,
            chipValue: skill.chipValue || 0,
            chipped: skill.chipped,
            ip: skill.ip,
            ipMult: 1, // No skills have those currently.
            isRoleSkill: skill.isSpecial || false,
        }};
    }

    templateSkills.forEach(([name, skill]) => {
        if(!skill.group) {
            let itemName = localize("Skill"+name);
            console.log(`Adding ${itemName}`);
            let data = skillData(itemName, skill);
            let item = new Item(data);
            pack.importEntity(item);
        }
        else {
            let parentName = localize("Skill"+name);
            Object.entries(skill).filter(([name, _]) => name != "group").forEach(([name, skill]) => {
                let newName = `${parentName}: ${localize("Skill"+name)}`;
                console.log(`Adding ${newName}`);
                let data = skillData(newName, skill);
                let item = new Item(data);
                pack.importEntity(item);
            });
        }
    });
}

Hooks.once('init', async function () {

    // Place classes in system namespace for later reference.
    game.cyberpunk = {
        entities: {
            CyberpunkActor,
            CyberpunkItem,
        },
        // A manual migrateworld.
        migrateWorld: migrations.migrateWorld,
        makeSkillsPack: makeSkillsCompendium
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
        console.log("CYBERPUNK: First run? No migration needed here");
        game.settings.set("cyberpunk", "systemMigrationVersion", game.system.data.version);
        return;
    }
    // The version migrations need to begin - if you make a change from 0.1 to 0.2, this should be 0.2
    const NEEDS_MIGRATION_VERSION = "0.2.6";
    console.log("CYBERPUNK: Last migrated in version: " + lastMigrateVersion);
    const needsMigration = lastMigrateVersion && isNewerVersion(NEEDS_MIGRATION_VERSION, lastMigrateVersion);
    if ( !needsMigration ) return;
    migrations.migrateWorld();
});