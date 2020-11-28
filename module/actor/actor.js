/**
 * Extend the base Actor entity by defining a custom roll data structure which is ideal for the Simple system.
 * @extends {Actor}
 */
export class CyberpunkActor extends Actor {

  /**
   * Augment the basic actor data with additional dynamic data - the stuff that's calculated from other data
   */
  prepareData() {
    super.prepareData();

    // Make separate methods for each Actor type (character, npc, etc.) to keep
    // things organized.
    switch ( this.data.type ) {
      case "character":
        return this._prepareCharacterData(this.data);
    }
  }

  /**
   * Prepare Character type specific data
   */
  _prepareCharacterData(actorData) {
    const data = actorData.data;
    
    const stats = data.stats;
    // Calculate stat totals using base+temp
    for(const stat of Object.values(stats)) {
      stat.total = stat.base + stat.tempMod;
    }

    // Reflex is affected by encumbrance values too
    for(const armor in data.armor) {
      if(armor.encumbrance != null) {
        stats.ref.armorMod -= armor.encumbrance;
      }
    }
    stats.ref.total = stats.ref.base + stats.ref.tempMod + stats.ref.armorMod;

    const move = stats.move;
    move.run = move.total * 3;
    move.leap = Math.floor(move.total / 4); 

    const body = stats.body;
    body.carry = body.total * 10;
    body.lift = body.total * 40;
    body.modifier = CyberpunkActor.btm(body.total);

    // This is where the effect wounds would have would be calculated
  }

  /**
   * Get a body type modifier from the body type stat (body)
   * I couldn't figure out a single formula that'd work for it (cos of the weird widths of BT values)
   */
  static btm(body) {
    if(body < 2) throw "Body type cannot be below 2."
    switch(body) {
      case 2: return 0
      case 3: 
      case 4: return 1
      case 5:
      case 6:
      case 7: return 2;
      case 8:
      case 9: return 3;
      case 10: return 4;
      case body > 10: return 5;
    }
  }

  // Current wound state. 0 for uninjured, going up by 1 for each new one. 1 for Serious, 2 critical etc.
  woundState() {
    const damage = this.data.data.damage;
    if(damage == 0) return 0;
    // Wound slots are 4 wide, so divide by 4, floor the result
    return Math.floor((damage-1)/4);
  }

  saveThreshold() {
    const body = this.data.data.stats.body.total;
    return body - this.woundState();
  }

}