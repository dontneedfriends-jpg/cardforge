import type { DeckMeta } from '../types/project';

export interface CardTemplate {
  id: string;
  name: string;
  description: string;
  cardSize: DeckMeta['cardSize'];
  html: string;
  css: string;
  sampleData: Record<string, string>[];
}

export const cardTemplates: CardTemplate[] = [
  {
    id: 'simple',
    name: 'Simple Card',
    description: 'Clean minimal card with name, type, and description',
    cardSize: { widthMm: 63, heightMm: 88, bleedMm: 3 },
    html: `<div class="card">
  <div class="card-header">
    <span class="card-name">{{name}}</span>
    <span class="card-type">{{type}}</span>
  </div>
  <div class="card-body">
    <p>{{description}}</p>
  </div>
  <div class="card-footer">
    <span class="card-cost">{{cost}}</span>
  </div>
</div>`,
    css: `
.card {
  width: 100%;
  height: 100%;
  background: linear-gradient(145deg, #1a1a2e 0%, #16213e 100%);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  font-family: 'Segoe UI', sans-serif;
  color: white;
  overflow: hidden;
  border: 2px solid #2a2a4a;
  box-shadow: inset 0 0 30px rgba(0,0,0,0.4);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: rgba(255,255,255,0.1);
  border-bottom: 1px solid rgba(255,255,255,0.1);
}

.card-name {
  font-weight: 700;
  font-size: 16px;
  letter-spacing: 0.5px;
}

.card-type {
  font-size: 11px;
  opacity: 0.7;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.card-body {
  flex: 1;
  padding: 16px;
  font-size: 13px;
  line-height: 1.5;
  overflow: hidden;
}

.card-footer {
  padding: 10px 16px;
  background: rgba(0,0,0,0.3);
  display: flex;
  justify-content: flex-end;
}

.card-cost {
  font-size: 18px;
  font-weight: 700;
  color: #ffd700;
}`,
    sampleData: [
      { name: 'Fireball', type: 'Spell', description: 'Deal 5 damage to target creature.', cost: '3' },
      { name: 'Healing Potion', type: 'Item', description: 'Restore 10 health points.', cost: '2' },
    ],
  },
  {
    id: 'creature',
    name: 'Creature / Monster',
    description: 'RPG creature card with stats (ATK, DEF, HP)',
    cardSize: { widthMm: 63, heightMm: 88, bleedMm: 3 },
    html: `<div class="card">
  <div class="card-rarity {{rarity}}"></div>
  <div class="card-header">
    <span class="card-name">{{name}}</span>
    <span class="card-cost">{{cost}}</span>
  </div>
  <div class="card-art">
    <img src="{{image}}" alt="{{name}}" />
  </div>
  <div class="card-type">{{type}}</div>
  <div class="card-abilities">
    <p>{{ability}}</p>
  </div>
  <div class="card-stats">
    <div class="stat">
      <span class="stat-label">ATK</span>
      <span class="stat-value">{{attack}}</span>
    </div>
    <div class="stat">
      <span class="stat-label">DEF</span>
      <span class="stat-value">{{defense}}</span>
    </div>
    <div class="stat">
      <span class="stat-label">HP</span>
      <span class="stat-value">{{health}}</span>
    </div>
  </div>
</div>`,
    css: `
.card {
  width: 100%;
  height: 100%;
  background: linear-gradient(145deg, #1a1a2e 0%, #16213e 100%);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  font-family: 'Segoe UI', sans-serif;
  color: white;
  overflow: hidden;
  border: 2px solid #2a2a4a;
  position: relative;
}

.card-rarity {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
}

.card-rarity.common { background: linear-gradient(90deg, #888, #bbb); }
.card-rarity.uncommon { background: linear-gradient(90deg, #2e8b57, #3cb371); }
.card-rarity.rare { background: linear-gradient(90deg, #1e90ff, #00bfff); }
.card-rarity.epic { background: linear-gradient(90deg, #9932cc, #ba55d3); }
.card-rarity.legendary { background: linear-gradient(90deg, #ff8c00, #ffd700); }

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  padding-top: 12px;
  background: rgba(255,255,255,0.1);
}

.card-name {
  font-weight: 800;
  font-size: 14px;
  letter-spacing: 0.5px;
  text-shadow: 0 1px 3px rgba(0,0,0,0.5);
}

.card-cost {
  font-weight: 700;
  font-size: 16px;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0,0,0,0.4);
  border-radius: 50%;
  border: 2px solid rgba(255,255,255,0.3);
}

.card-art {
  height: 120px;
  overflow: hidden;
  margin: 8px 12px;
  border-radius: 8px;
  border: 1px solid rgba(255,255,255,0.1);
}

.card-art img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.card-type {
  text-align: center;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 2px;
  opacity: 0.6;
  padding: 4px 0;
  border-bottom: 1px solid rgba(255,255,255,0.1);
}

.card-abilities {
  flex: 1;
  padding: 8px 12px;
  font-size: 12px;
  line-height: 1.4;
}

.card-abilities p {
  margin: 0;
}

.card-stats {
  display: flex;
  justify-content: space-around;
  padding: 10px;
  background: rgba(0,0,0,0.3);
  border-top: 1px solid rgba(255,255,255,0.1);
}

.stat {
  text-align: center;
}

.stat-label {
  display: block;
  font-size: 9px;
  opacity: 0.6;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.stat-value {
  display: block;
  font-size: 18px;
  font-weight: 700;
  text-shadow: 0 2px 4px rgba(0,0,0,0.5);
}`,
    sampleData: [
      { name: 'Dragon', cost: '7', type: 'Creature', rarity: 'legendary', attack: '8', defense: '5', health: '12', ability: 'Flying. When Dragon enters, deal 3 damage to all enemies.', image: 'assets/dragon.png' },
      { name: 'Goblin', cost: '2', type: 'Creature', rarity: 'common', attack: '3', defense: '1', health: '2', ability: 'Quick: Can attack immediately.', image: 'assets/goblin.png' },
    ],
  },
  {
    id: 'spell',
    name: 'Spell Card',
    description: 'Magic spell with mana cost and effect text',
    cardSize: { widthMm: 63, heightMm: 88, bleedMm: 3 },
    html: `<div class="card spell">
  <div class="card-header">
    <span class="card-name">{{name}}</span>
    <div class="mana-cost">{{mana}}</div>
  </div>
  <div class="card-type-line">{{type}} — {{school}}</div>
  <div class="card-art">
    <img src="{{image}}" alt="{{name}}" />
  </div>
  <div class="card-effect">
    <p>{{effect}}</p>
  </div>
  <div class="card-flavor">
    <em>{{flavor}}</em>
  </div>
  <div class="card-footer">
    <span class="card-rarity {{rarity}}">{{rarity}}</span>
  </div>
</div>`,
    css: `
.card.spell {
  width: 100%;
  height: 100%;
  background: linear-gradient(145deg, #0f3460 0%, #16213e 100%);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  font-family: 'Segoe UI', sans-serif;
  color: white;
  overflow: hidden;
  border: 2px solid #1a5276;
  box-shadow: inset 0 0 30px rgba(0,0,0,0.3);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: rgba(26, 82, 118, 0.4);
  border-bottom: 1px solid rgba(255,255,255,0.1);
}

.card-name {
  font-weight: 700;
  font-size: 15px;
  letter-spacing: 0.5px;
}

.mana-cost {
  font-weight: 700;
  font-size: 16px;
  color: #74b9ff;
  background: rgba(0,0,0,0.4);
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid rgba(116, 185, 255, 0.4);
}

.card-type-line {
  padding: 6px 16px;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  opacity: 0.7;
  background: rgba(0,0,0,0.2);
}

.card-art {
  height: 100px;
  overflow: hidden;
  margin: 8px 16px;
  border-radius: 6px;
}

.card-art img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.card-effect {
  flex: 1;
  padding: 12px 16px;
  font-size: 13px;
  line-height: 1.5;
  background: rgba(255,255,255,0.05);
  margin: 0 8px;
  border-radius: 6px;
}

.card-flavor {
  padding: 8px 16px;
  font-size: 11px;
  opacity: 0.6;
  font-style: italic;
  text-align: center;
}

.card-footer {
  padding: 8px 16px;
  display: flex;
  justify-content: flex-end;
  background: rgba(0,0,0,0.2);
}

.card-rarity.common { color: #bdc3c7; }
.card-rarity.uncommon { color: #2ecc71; }
.card-rarity.rare { color: #3498db; }
.card-rarity.epic { color: #9b59b6; }
.card-rarity.legendary { color: #f1c40f; }

.card-rarity {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 2px;
  font-weight: 700;
}`,
    sampleData: [
      { name: 'Lightning Bolt', mana: '2', type: 'Instant', school: 'Evocation', effect: 'Deal 4 damage to target creature or player.', flavor: '"The sky itself answers your call."', rarity: 'common', image: 'assets/lightning.png' },
      { name: 'Time Warp', mana: '5', type: 'Sorcery', school: 'Chronomancy', effect: 'Take an extra turn after this one.', flavor: '"Time is but a canvas for the powerful."', rarity: 'legendary', image: 'assets/time.png' },
    ],
  },
  {
    id: 'equipment',
    name: 'Equipment / Item',
    description: 'Weapon, armor, or magical item with rarity and stats',
    cardSize: { widthMm: 63, heightMm: 88, bleedMm: 3 },
    html: `<div class="card equipment">
  <div class="card-rarity {{rarity}}"></div>
  <div class="card-header">
    <span class="card-name">{{name}}</span>
  </div>
  <div class="card-subtitle">{{type}} — {{slot}}</div>
  <div class="card-art">
    <img src="{{image}}" alt="{{name}}" />
  </div>
  <div class="card-stats">
    <div class="item-stat"><span>+{{bonus}}</span> {{stat}}</div>
  </div>
  <div class="card-effect">
    <p>{{effect}}</p>
  </div>
  <div class="card-footer">
    <span class="durability">Durability: {{durability}}</span>
    <span class="value">{{value}}g</span>
  </div>
</div>`,
    css: `
.card.equipment {
  width: 100%;
  height: 100%;
  background: linear-gradient(145deg, #2c3e50 0%, #1a252f 100%);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  font-family: 'Segoe UI', sans-serif;
  color: white;
  overflow: hidden;
  border: 2px solid #34495e;
  position: relative;
}

.card-rarity {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
}

.card-rarity.common { background: #95a5a6; }
.card-rarity.uncommon { background: #2ecc71; }
.card-rarity.rare { background: #3498db; }
.card-rarity.epic { background: #9b59b6; }
.card-rarity.legendary { background: linear-gradient(90deg, #f39c12, #f1c40f); }

.card-header {
  padding: 12px 16px;
  padding-top: 16px;
  background: rgba(255,255,255,0.05);
}

.card-name {
  font-weight: 800;
  font-size: 15px;
  letter-spacing: 0.5px;
}

.card-subtitle {
  padding: 4px 16px;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  opacity: 0.6;
  background: rgba(0,0,0,0.2);
}

.card-art {
  height: 110px;
  overflow: hidden;
  margin: 8px 16px;
  border-radius: 6px;
  border: 1px solid rgba(255,255,255,0.1);
}

.card-art img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.card-stats {
  padding: 8px 16px;
  text-align: center;
}

.item-stat {
  font-size: 18px;
  font-weight: 700;
  color: #f1c40f;
}

.item-stat span {
  font-size: 24px;
}

.card-effect {
  flex: 1;
  padding: 8px 16px;
  font-size: 12px;
  line-height: 1.4;
}

.card-footer {
  padding: 10px 16px;
  display: flex;
  justify-content: space-between;
  background: rgba(0,0,0,0.3);
  border-top: 1px solid rgba(255,255,255,0.1);
  font-size: 11px;
}

.durability {
  opacity: 0.7;
}

.value {
  color: #f1c40f;
  font-weight: 700;
}`,
    sampleData: [
      { name: 'Flame Sword', type: 'Weapon', slot: 'Main Hand', rarity: 'rare', bonus: '3', stat: 'Fire Damage', effect: 'Attacks deal additional 2 fire damage. Ignites target for 2 turns.', durability: '50/50', value: '250', image: 'assets/sword.png' },
      { name: 'Shield of Light', type: 'Armor', slot: 'Off Hand', rarity: 'epic', bonus: '5', stat: 'Defense', effect: 'Blocks the first attack each turn. Heals 1 HP when blocking.', durability: '80/80', value: '500', image: 'assets/shield.png' },
    ],
  },
  {
    id: 'location',
    name: 'Location / Place',
    description: 'Dungeon, city, or region card with effects',
    cardSize: { widthMm: 63, heightMm: 88, bleedMm: 3 },
    html: `<div class="card location">
  <div class="card-image-bg">
    <img src="{{image}}" alt="{{name}}" />
    <div class="card-title-overlay">
      <h2>{{name}}</h2>
      <span class="location-type">{{type}}</span>
    </div>
  </div>
  <div class="card-body">
    <div class="location-level">Danger Level: {{danger}}</div>
    <div class="location-effect">
      <p><strong>Effect:</strong> {{effect}}</p>
    </div>
    <div class="location-rewards">
      <p><strong>Rewards:</strong> {{rewards}}</p>
    </div>
  </div>
</div>`,
    css: `
.card.location {
  width: 100%;
  height: 100%;
  background: #1a1a2e;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  font-family: 'Segoe UI', sans-serif;
  color: white;
  overflow: hidden;
  border: 2px solid #2a2a4a;
}

.card-image-bg {
  position: relative;
  height: 140px;
  overflow: hidden;
}

.card-image-bg img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: brightness(0.6);
}

.card-title-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 16px;
  background: linear-gradient(transparent, rgba(0,0,0,0.8));
}

.card-title-overlay h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 800;
  text-shadow: 0 2px 4px rgba(0,0,0,0.8);
}

.location-type {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 2px;
  opacity: 0.8;
}

.card-body {
  flex: 1;
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.location-level {
  font-size: 12px;
  font-weight: 700;
  color: #e74c3c;
  text-align: center;
  padding: 4px;
  background: rgba(231, 76, 60, 0.1);
  border-radius: 4px;
  border: 1px solid rgba(231, 76, 60, 0.3);
}

.location-effect, .location-rewards {
  font-size: 12px;
  line-height: 1.4;
}

.location-effect p, .location-rewards p {
  margin: 0;
}

.location-rewards {
  color: #f1c40f;
}`,
    sampleData: [
      { name: 'Dark Forest', type: 'Wilderness', danger: 'Medium', effect: 'All creatures get +1 attack. At the end of each turn, take 1 damage.', rewards: '2-4 common items, 30% chance of rare herb', image: 'assets/forest.png' },
      { name: 'Crystal Cave', type: 'Dungeon', danger: 'High', effect: 'Spells cost 1 less mana. Magic damage is doubled.', rewards: '1-2 rare gems, 1 epic item', image: 'assets/cave.png' },
    ],
  },
  {
    id: 'hero',
    name: 'Hero / Character',
    description: 'Playable character with class, level and abilities',
    cardSize: { widthMm: 63, heightMm: 88, bleedMm: 3 },
    html: `<div class="card hero">
  <div class="card-portrait">
    <img src="{{image}}" alt="{{name}}" />
    <div class="hero-level">Lvl {{level}}</div>
  </div>
  <div class="card-info">
    <div class="hero-name">{{name}}</div>
    <div class="hero-class">{{class}}</div>
    <div class="hero-stats">
      <div class="h-stat"><span>STR</span>{{strength}}</div>
      <div class="h-stat"><span>DEX</span>{{dexterity}}</div>
      <div class="h-stat"><span>INT</span>{{intelligence}}</div>
      <div class="h-stat"><span>CON</span>{{constitution}}</div>
    </div>
    <div class="hero-hp">HP: {{hp}}/{{maxHp}}</div>
    <div class="hero-ability">
      <strong>{{abilityName}}:</strong> {{abilityDesc}}
    </div>
  </div>
</div>`,
    css: `
.card.hero {
  width: 100%;
  height: 100%;
  background: linear-gradient(145deg, #2d3436 0%, #1a1a2e 100%);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  font-family: 'Segoe UI', sans-serif;
  color: white;
  overflow: hidden;
  border: 2px solid #2a2a4a;
}

.card-portrait {
  position: relative;
  height: 130px;
  overflow: hidden;
}

.card-portrait img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: brightness(0.7);
}

.hero-level {
  position: absolute;
  top: 8px;
  right: 8px;
  background: rgba(0,0,0,0.7);
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 700;
  border: 1px solid rgba(255,255,255,0.2);
}

.card-info {
  flex: 1;
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.hero-name {
  font-size: 16px;
  font-weight: 800;
  text-align: center;
  letter-spacing: 0.5px;
}

.hero-class {
  text-align: center;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 2px;
  opacity: 0.7;
  color: #74b9ff;
}

.hero-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px;
  padding: 6px 0;
}

.h-stat {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  padding: 2px 6px;
  background: rgba(255,255,255,0.05);
  border-radius: 4px;
}

.h-stat span {
  font-size: 10px;
  opacity: 0.6;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.hero-hp {
  text-align: center;
  font-size: 14px;
  font-weight: 700;
  color: #e74c3c;
  padding: 4px;
  background: rgba(231, 76, 60, 0.1);
  border-radius: 4px;
  border: 1px solid rgba(231, 76, 60, 0.2);
}

.hero-ability {
  font-size: 11px;
  line-height: 1.4;
  padding: 6px;
  background: rgba(116, 185, 255, 0.1);
  border-radius: 4px;
  border: 1px solid rgba(116, 185, 255, 0.2);
}`,
    sampleData: [
      { name: 'Aragorn', class: 'Ranger', level: '5', strength: '14', dexterity: '16', intelligence: '10', constitution: '12', hp: '45', maxHp: '45', abilityName: 'Hunter\'s Mark', abilityDesc: 'Deal +2 damage to marked targets. Mark lasts 2 turns.', image: 'assets/ranger.png' },
      { name: 'Merlin', class: 'Wizard', level: '7', strength: '8', dexterity: '10', intelligence: '18', constitution: '9', hp: '32', maxHp: '32', abilityName: 'Arcane Mastery', abilityDesc: 'Spells cost 1 less mana. Can cast twice per turn.', image: 'assets/wizard.png' },
    ],
  },
  {
    id: 'resource',
    name: 'Resource / Token',
    description: 'Simple resource card - gold, mana, materials',
    cardSize: { widthMm: 41, heightMm: 63, bleedMm: 2 },
    html: `<div class="card resource">
  <div class="resource-icon">
    <img src="{{image}}" alt="{{name}}" />
  </div>
  <div class="resource-name">{{name}}</div>
  <div class="resource-amount">{{amount}}</div>
  <div class="resource-desc">{{description}}</div>
</div>`,
    css: `
.card.resource {
  width: 100%;
  height: 100%;
  background: linear-gradient(145deg, #1e3a5f 0%, #0d2137 100%);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-family: 'Segoe UI', sans-serif;
  color: white;
  overflow: hidden;
  border: 2px solid #2a5a8a;
  padding: 8px;
  text-align: center;
}

.resource-icon {
  width: 40px;
  height: 40px;
  margin-bottom: 4px;
}

.resource-icon img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.resource-name {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 2px;
}

.resource-amount {
  font-size: 24px;
  font-weight: 800;
  color: #f1c40f;
  text-shadow: 0 2px 4px rgba(0,0,0,0.5);
  margin-bottom: 4px;
}

.resource-desc {
  font-size: 9px;
  opacity: 0.7;
  line-height: 1.3;
}`,
    sampleData: [
      { name: 'Gold', amount: '100', description: 'Currency for trading', image: 'assets/gold.png' },
      { name: 'Mana', amount: '5', description: 'Used to cast spells', image: 'assets/mana.png' },
      { name: 'Wood', amount: '3', description: 'Crafting material', image: 'assets/wood.png' },
    ],
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Ultra-minimalist card with just text',
    cardSize: { widthMm: 63, heightMm: 88, bleedMm: 3 },
    html: `<div class="card minimal">
  <div class="card-content">
    <h1>{{title}}</h1>
    <p>{{text}}</p>
    <div class="card-tag">{{tag}}</div>
  </div>
</div>`,
    css: `
.card.minimal {
  width: 100%;
  height: 100%;
  background: #fff;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  font-family: 'Segoe UI', sans-serif;
  color: #333;
  overflow: hidden;
  border: 1px solid #ddd;
}

.card-content {
  flex: 1;
  padding: 20px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.card-content h1 {
  font-size: 20px;
  font-weight: 700;
  margin: 0;
  color: #222;
}

.card-content p {
  font-size: 14px;
  line-height: 1.6;
  margin: 12px 0;
  color: #555;
}

.card-tag {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 2px;
  color: #888;
  border-top: 1px solid #eee;
  padding-top: 8px;
}`,
    sampleData: [
      { title: 'Victory Point', text: 'Worth 1 victory point at the end of the game.', tag: 'VP Token' },
      { title: 'Action Card', text: 'Take an additional action this turn.', tag: 'Action' },
    ],
  },
  {
    id: 'munchkin',
    name: 'Munchkin Style',
    description: 'Humorous fantasy RPG card with medieval theme and gold borders',
    cardSize: { widthMm: 63, heightMm: 88, bleedMm: 3 },
    html: `<div class="card munchkin">
  <div class="card-border">
    <div class="card-header">
      <div class="card-level">Lvl {{level}}</div>
      <div class="card-type">{{type}}</div>
    </div>
    <div class="card-art">
      <img src="{{image}}" alt="{{name}}" />
    </div>
    <div class="card-name">{{name}}</div>
    <div class="card-bonus">+{{bonus}}</div>
    <div class="card-description">
      <p>{{description}}</p>
    </div>
    <div class="card-flavor">
      <em>{{flavor}}</em>
    </div>
    <div class="card-footer">
      <span class="card-class">{{class}}</span>
    </div>
  </div>
</div>`,
    css: `
.card.munchkin {
  width: 100%;
  height: 100%;
  background: linear-gradient(145deg, #f4e4c1 0%, #d4a574 50%, #c9956c 100%);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  font-family: 'Georgia', 'Times New Roman', serif;
  color: #3d2817;
  overflow: hidden;
  border: 4px solid #d4af37;
  box-shadow: inset 0 0 20px rgba(0,0,0,0.2), 0 4px 16px rgba(0,0,0,0.3);
}

.card-border {
  flex: 1;
  margin: 4px;
  border: 2px solid #8b6914;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.3);
}

.card-header {
  display: flex;
  justify-content: space-between;
  padding: 6px 10px;
  background: linear-gradient(180deg, rgba(139, 105, 20, 0.3) 0%, transparent 100%);
}

.card-level {
  font-size: 14px;
  font-weight: bold;
  color: #8b0000;
  text-shadow: 1px 1px 0 rgba(255,255,255,0.5);
}

.card-type {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: #5a3d1f;
  font-weight: bold;
}

.card-art {
  height: 90px;
  margin: 4px 8px;
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid rgba(139, 105, 20, 0.4);
  background: #f0e6d3;
}

.card-art img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.card-name {
  font-size: 16px;
  font-weight: bold;
  text-align: center;
  padding: 4px 8px;
  color: #3d2817;
  text-shadow: 1px 1px 0 rgba(255,255,255,0.5);
}

.card-bonus {
  font-size: 24px;
  font-weight: bold;
  text-align: center;
  color: #8b0000;
  text-shadow: 1px 1px 0 rgba(255,255,255,0.5);
}

.card-description {
  flex: 1;
  padding: 6px 10px;
  font-size: 11px;
  line-height: 1.3;
  color: #3d2817;
}

.card-description p {
  margin: 0;
}

.card-flavor {
  padding: 4px 10px;
  font-size: 10px;
  font-style: italic;
  color: #5a3d1f;
  text-align: center;
  border-top: 1px dashed rgba(139, 105, 20, 0.3);
}

.card-footer {
  padding: 6px 10px;
  background: linear-gradient(0deg, rgba(139, 105, 20, 0.3) 0%, transparent 100%);
  text-align: center;
}

.card-class {
  font-size: 11px;
  font-weight: bold;
  text-transform: uppercase;
  color: #5a3d1f;
  letter-spacing: 1px;
}`,
    sampleData: [
      { name: 'Chainsaw of Bloody Dismemberment', type: 'Item', level: '1', bonus: '3', description: 'Useable only by Warriors. +3 Bonus.', flavor: 'It goes VROOM VROOM!', class: 'Warrior', image: 'assets/chainsaw.png' },
      { name: 'Elf', type: 'Race', level: '1', bonus: '0', description: '+1 to Run Away. You may have 5 cards in your hand.', flavor: 'Pointy ears come in handy.', class: 'Any', image: 'assets/elf.png' },
      { name: 'Plutonium Dragon', type: 'Monster', level: '20', bonus: '0', description: 'Will not pursue anyone of Level 5 or below.', flavor: 'Radioactive breath weapon.', class: '', image: 'assets/dragon.png' },
    ],
  },
  {
    id: 'fluxx',
    name: 'Fluxx Style',
    description: 'Dynamic card with changing rules - bright colors and clean layout',
    cardSize: { widthMm: 63, heightMm: 88, bleedMm: 3 },
    html: `<div class="card fluxx">
  <div class="card-color-bar {{type}}"></div>
  <div class="card-content">
    <div class="card-type-badge">{{type}}</div>
    <div class="card-name">{{name}}</div>
    <div class="card-icon">{{icon}}</div>
    <div class="card-description">
      <p>{{description}}</p>
    </div>
    <div class="card-rule">
      <strong>Rule:</strong> {{rule}}
    </div>
  </div>
</div>`,
    css: `
.card.fluxx {
  width: 100%;
  height: 100%;
  background: #f8f9fa;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  font-family: 'Arial', 'Helvetica', sans-serif;
  color: #212529;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
}

.card-color-bar {
  height: 12px;
  width: 100%;
}

.card-color-bar.Goal { background: linear-gradient(90deg, #28a745, #20c997); }
.card-color-bar.Rule { background: linear-gradient(90deg, #ffc107, #ff9800); }
.card-color-bar.Action { background: linear-gradient(90deg, #dc3545, #e91e63); }
.card-color-bar.Keeper { background: linear-gradient(90deg, #007bff, #2196f3); }
.card-color-bar.Creeper { background: linear-gradient(90deg, #6c757d, #9e9e9e); }

.card-content {
  flex: 1;
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
}

.card-type-badge {
  font-size: 10px;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 2px;
  color: #6c757d;
  margin-bottom: 8px;
}

.card-name {
  font-size: 18px;
  font-weight: bold;
  color: #212529;
  margin-bottom: 8px;
  line-height: 1.2;
}

.card-icon {
  font-size: 36px;
  text-align: center;
  margin: 8px 0;
  line-height: 1;
}

.card-description {
  flex: 1;
  font-size: 13px;
  line-height: 1.4;
  color: #495057;
}

.card-description p {
  margin: 0;
}

.card-rule {
  margin-top: 8px;
  padding: 8px;
  background: rgba(0, 123, 255, 0.1);
  border-radius: 8px;
  border-left: 3px solid #007bff;
  font-size: 12px;
  color: #0056b3;
}`,
    sampleData: [
      { name: 'Peace (No War)', type: 'Goal', icon: '🕊️', description: 'If no one has War on the table, the player with Peace wins.', rule: 'If War is played, this Goal is discarded.' },
      { name: 'Draw 3', type: 'Rule', icon: '📋', description: 'If you have fewer than 3 cards in hand, draw cards until you have 3.', rule: 'This rule replaces any previous Draw rule.' },
      { name: 'Trash Something', type: 'Action', icon: '🗑️', description: 'Choose one card in play and discard it.', rule: 'You may choose one of your own cards.' },
      { name: 'The Party', type: 'Keeper', icon: '🎉', description: 'The player with The Party on the table may draw an extra card each turn.', rule: 'If The Bomb is played, discard The Party.' },
    ],
  },
  {
    id: 'exploding-kittens',
    name: 'Exploding Kittens Style',
    description: 'Funny illustrated cards with cute kittens and explosions',
    cardSize: { widthMm: 63, heightMm: 88, bleedMm: 3 },
    html: `<div class="card kittens">
  <div class="card-background"></div>
  <div class="card-art">
    <img src="{{image}}" alt="{{name}}" />
  </div>
  <div class="card-content">
    <div class="card-name">{{name}}</div>
    <div class="card-type">{{type}}</div>
    <div class="card-description">
      <p>{{description}}</p>
    </div>
    <div class="card-footer">
      <span class="card-icon-small">{{icon}}</span>
      <span class="card-count">x{{count}}</span>
    </div>
  </div>
</div>`,
    css: `
.card.kittens {
  width: 100%;
  height: 100%;
  background: #2d3436;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  font-family: 'Comic Sans MS', 'Chalkboard SE', 'Comic Neue', cursive;
  color: #dfe6e9;
  overflow: hidden;
  border: 3px solid #636e72;
  box-shadow: 0 4px 16px rgba(0,0,0,0.3);
  position: relative;
}

.card-background {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 30% 70%, rgba(255, 118, 117, 0.2) 0%, transparent 50%),
              radial-gradient(circle at 70% 30%, rgba(116, 185, 255, 0.2) 0%, transparent 50%);
  pointer-events: none;
}

.card-art {
  height: 140px;
  margin: 12px 12px 0;
  border-radius: 12px;
  overflow: hidden;
  position: relative;
  z-index: 1;
  border: 2px solid rgba(255, 255, 255, 0.1);
  background: #1e272e;
}

.card-art img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.card-content {
  flex: 1;
  padding: 12px;
  display: flex;
  flex-direction: column;
  position: relative;
  z-index: 1;
}

.card-name {
  font-size: 16px;
  font-weight: bold;
  color: #fab1a0;
  text-align: center;
  margin-bottom: 4px;
  text-shadow: 2px 2px 0 rgba(0,0,0,0.3);
}

.card-type {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 2px;
  color: #74b9ff;
  text-align: center;
  margin-bottom: 8px;
}

.card-description {
  flex: 1;
  font-size: 12px;
  line-height: 1.4;
  color: #dfe6e9;
  text-align: center;
}

.card-description p {
  margin: 0;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 8px;
  border-top: 2px dashed rgba(255, 255, 255, 0.1);
  margin-top: 8px;
}

.card-icon-small {
  font-size: 20px;
}

.card-count {
  font-size: 14px;
  font-weight: bold;
  color: #fdcb6e;
}`,
    sampleData: [
      { name: 'Exploding Kitten', type: 'Kitten', description: 'Show this card immediately. Unless you have a Defuse card, you\'re out!', icon: '💥', count: '4', image: 'assets/exploding.png' },
      { name: 'Defuse', type: 'Action', description: 'Place your Defuse card in the discard pile and save yourself.', icon: '🧯', count: '6', image: 'assets/defuse.png' },
      { name: 'Attack', type: 'Action', description: 'End your turn without drawing a card. Force the next player to take 2 turns.', icon: '⚔️', count: '4', image: 'assets/attack.png' },
      { name: 'Tacocat', type: 'Cat', description: 'Play as a pair to steal a random card from another player.', icon: '🌮', count: '4', image: 'assets/tacocat.png' },
      { name: 'Beard Cat', type: 'Cat', description: 'Play as a pair to steal a random card from another player.', icon: '🧔', count: '4', image: 'assets/beardcat.png' },
      { name: 'See the Future', type: 'Action', description: 'Privately view the top 3 cards from the Draw Pile.', icon: '🔮', count: '5', image: 'assets/future.png' },
    ],
  },
  {
    id: 'scifi',
    name: 'Sci-Fi / Cyberpunk',
    description: 'Neon-lit futuristic card with hacking themes and glitch effects',
    cardSize: { widthMm: 63, heightMm: 88, bleedMm: 3 },
    html: `<div class="card scifi">
  <div class="card-grid"></div>
  <div class="card-glow {{faction}}"></div>
  <div class="card-header">
    <span class="card-name">{{name}}</span>
    <span class="card-cost">{{cost}}</span>
  </div>
  <div class="card-type-line">{{type}} — {{faction}}</div>
  <div class="card-art">
    <img src="{{image}}" alt="{{name}}" />
  </div>
  <div class="card-stats-horizontal">
    <div class="cyber-stat"><span>CPU</span>{{cpu}}</div>
    <div class="cyber-stat"><span>RAM</span>{{ram}}</div>
    <div class="cyber-stat"><span>NET</span>{{net}}</div>
  </div>
  <div class="card-effect">
    <p>{{effect}}</p>
  </div>
  <div class="card-flavor">
    <em>{{flavor}}</em>
  </div>
</div>`,
    css: `
.card.scifi {
  width: 100%;
  height: 100%;
  background: linear-gradient(145deg, #0a0a0f 0%, #1a1a2e 100%);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  font-family: 'Courier New', 'Consolas', monospace;
  color: #0ff;
  overflow: hidden;
  border: 1px solid rgba(0, 255, 255, 0.3);
  position: relative;
}

.card-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(0, 255, 255, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 255, 255, 0.03) 1px, transparent 1px);
  background-size: 20px 20px;
  pointer-events: none;
}

.card-glow {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
}

.card-glow.Netcorp { background: linear-gradient(90deg, #0ff, #00bfff); }
.card-glow.Arclight { background: linear-gradient(90deg, #f0f, #ff00bf); }
.card-glow.OmniCorp { background: linear-gradient(90deg, #ff0, #ffbf00); }

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px;
  padding-top: 14px;
  position: relative;
  z-index: 1;
}

.card-name {
  font-weight: 700;
  font-size: 14px;
  color: #fff;
  text-shadow: 0 0 8px rgba(0, 255, 255, 0.5);
  text-transform: uppercase;
  letter-spacing: 1px;
}

.card-cost {
  font-weight: 700;
  font-size: 16px;
  color: #0ff;
  text-shadow: 0 0 8px rgba(0, 255, 255, 0.5);
  background: rgba(0, 255, 255, 0.1);
  border: 1px solid rgba(0, 255, 255, 0.4);
  border-radius: 50%;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.card-type-line {
  padding: 4px 14px;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 2px;
  color: rgba(0, 255, 255, 0.6);
  position: relative;
  z-index: 1;
  border-bottom: 1px solid rgba(0, 255, 255, 0.1);
}

.card-art {
  height: 90px;
  margin: 8px 14px;
  border-radius: 4px;
  overflow: hidden;
  position: relative;
  z-index: 1;
  border: 1px solid rgba(0, 255, 255, 0.2);
  background: #0a0a0f;
}

.card-art img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: saturate(1.2) contrast(1.1);
}

.card-stats-horizontal {
  display: flex;
  gap: 4px;
  padding: 6px 14px;
  position: relative;
  z-index: 1;
}

.cyber-stat {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  font-size: 16px;
  font-weight: 700;
  color: #fff;
  background: rgba(0, 255, 255, 0.05);
  border: 1px solid rgba(0, 255, 255, 0.2);
  border-radius: 4px;
  padding: 4px;
}

.cyber-stat span {
  font-size: 8px;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: rgba(0, 255, 255, 0.6);
}

.card-effect {
  flex: 1;
  padding: 8px 14px;
  font-size: 11px;
  line-height: 1.4;
  color: rgba(255, 255, 255, 0.8);
  position: relative;
  z-index: 1;
}

.card-effect p {
  margin: 0;
}

.card-flavor {
  padding: 6px 14px;
  font-size: 10px;
  color: rgba(0, 255, 255, 0.4);
  border-top: 1px solid rgba(0, 255, 255, 0.1);
  text-align: center;
  position: relative;
  z-index: 1;
}`,
    sampleData: [
      { name: 'ICE Override', cost: '3', type: 'Program', faction: 'Netcorp', cpu: '2', ram: '4', net: '1', effect: 'Bypass target ICE. Gain access to encrypted data nodes.', flavor: 'The firewall wept ones and zeros.', image: 'assets/ice.png' },
      { name: 'Neural Implant', cost: '5', type: 'Cyberware', faction: 'Arclight', cpu: '1', ram: '6', net: '3', effect: 'Boost neural processor: draw 2 additional cards each turn.', flavor: 'Your brain, but better. Probably.', image: 'assets/neural.png' },
      { name: 'Data Leech', cost: '2', type: 'Program', faction: 'OmniCorp', cpu: '3', ram: '2', net: '4', effect: 'Steal 1 credit from target opponent each turn. Can be upgraded to steal 2.', flavor: 'Blood in the water. Data on the wire.', image: 'assets/leech.png' },
    ],
  },
  {
    id: 'horror',
    name: 'Horror / Gothic',
    description: 'Dark, eldritch-themed card with blood-red accents and gothic typography',
    cardSize: { widthMm: 63, heightMm: 88, bleedMm: 3 },
    html: `<div class="card horror">
  <div class="card-vignette"></div>
  <div class="card-header">
    <span class="card-name">{{name}}</span>
    <span class="card-dread">{{dread}}</span>
  </div>
  <div class="card-art">
    <img src="{{image}}" alt="{{name}}" />
  </div>
  <div class="card-subtitle">{{type}} — {{origin}}</div>
  <div class="card-body">
    <div class="card-omen">{{omen}}</div>
    <div class="card-description">{{description}}</div>
  </div>
  <div class="card-footer">
    <span class="card-sanity">{{sanity}} SAN</span>
    <span class="card-power">{{power}} PWR</span>
  </div>
</div>`,
    css: `
.card.horror {
  width: 100%;
  height: 100%;
  background: linear-gradient(180deg, #1a0a0a 0%, #0d0505 30%, #0a0a0a 100%);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  font-family: 'Georgia', 'Times New Roman', serif;
  color: #d4c5a9;
  overflow: hidden;
  border: 2px solid #4a1a1a;
  position: relative;
}

.card-vignette {
  position: absolute;
  inset: 0;
  box-shadow: inset 0 0 60px rgba(0, 0, 0, 0.8), inset 0 0 120px rgba(74, 26, 26, 0.3);
  pointer-events: none;
  z-index: 2;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 14px;
  padding-top: 14px;
  position: relative;
  z-index: 1;
  border-bottom: 1px solid rgba(74, 26, 26, 0.6);
}

.card-name {
  font-weight: 700;
  font-size: 16px;
  color: #e8d5b5;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
  letter-spacing: 0.5px;
}

.card-dread {
  font-weight: 700;
  font-size: 12px;
  color: #c0392b;
  text-shadow: 0 0 8px rgba(192, 57, 43, 0.5);
  padding: 2px 10px;
  border: 1px solid rgba(192, 57, 43, 0.4);
  border-radius: 4px;
  background: rgba(192, 57, 43, 0.1);
}

.card-art {
  height: 110px;
  margin: 8px 14px 0;
  border-radius: 4px;
  overflow: hidden;
  position: relative;
  z-index: 1;
  border: 1px solid rgba(74, 26, 26, 0.6);
  filter: sepia(0.3) brightness(0.8);
}

.card-art img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.card-subtitle {
  padding: 6px 14px;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 2px;
  color: rgba(212, 197, 169, 0.5);
  text-align: center;
  position: relative;
  z-index: 1;
}

.card-body {
  flex: 1;
  padding: 8px 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  position: relative;
  z-index: 1;
}

.card-omen {
  text-align: center;
  font-size: 13px;
  font-weight: 700;
  color: #c0392b;
  font-style: italic;
  text-shadow: 0 0 6px rgba(192, 57, 43, 0.3);
  padding: 4px;
  background: rgba(192, 57, 43, 0.08);
  border: 1px solid rgba(192, 57, 43, 0.2);
  border-radius: 4px;
}

.card-description {
  font-size: 12px;
  line-height: 1.5;
  color: rgba(212, 197, 169, 0.8);
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
}

.card-footer {
  display: flex;
  justify-content: space-between;
  padding: 8px 14px;
  border-top: 1px solid rgba(74, 26, 26, 0.6);
  position: relative;
  z-index: 1;
  font-size: 12px;
}

.card-sanity {
  color: #74b9ff;
  font-weight: 700;
  text-shadow: 0 0 4px rgba(116, 185, 255, 0.3);
}

.card-power {
  color: #e74c3c;
  font-weight: 700;
  text-shadow: 0 0 4px rgba(231, 76, 60, 0.3);
}`,
    sampleData: [
      { name: 'The Watcher in the Dark', dread: 'VII', type: 'Eldritch Entity', origin: 'Void', omen: 'It sees through your eyes.', description: 'At the start of each turn, discard one card at random. If you cannot, take 2 sanity damage.', sanity: '3', power: '7', image: 'assets/watcher.png' },
      { name: 'Crimson Ritual', dread: 'IV', type: 'Ritual', origin: 'Occult', omen: 'Blood for the blood god.', description: 'Sacrifice 2 sanity: deal 5 damage to all enemies. Can only be performed at night.', sanity: '-2', power: '5', image: 'assets/ritual.png' },
      { name: 'Forgotten Locket', dread: 'II', type: 'Artifact', origin: 'Haunted', omen: 'A mother\'s love never dies.', description: 'Once per turn, restore 1 sanity. If you sell it, gain 10 gold but lose 2 max sanity.', sanity: '+1', power: '0', image: 'assets/locket.png' },
    ],
  },
  {
    id: 'board-tile',
    name: 'Board Game Tile',
    description: 'Square terrain tile for board games - hex-style with resources',
    cardSize: { widthMm: 70, heightMm: 70, bleedMm: 3 },
    html: `<div class="card tile {{terrain}}">
  <div class="tile-overlay"></div>
  <div class="tile-content">
    <div class="tile-icon">{{icon}}</div>
    <div class="tile-name">{{name}}</div>
    <div class="tile-terrain">{{terrain}}</div>
    <div class="tile-resources">
      <div class="tile-resource">
        <span class="res-icon">🌾</span>
        <span class="res-val">{{food}}</span>
      </div>
      <div class="tile-resource">
        <span class="res-icon">⛏️</span>
        <span class="res-val">{{ore}}</span>
      </div>
      <div class="tile-resource">
        <span class="res-icon">🪵</span>
        <span class="res-val">{{wood}}</span>
      </div>
      <div class="tile-resource">
        <span class="res-icon">✨</span>
        <span class="res-val">{{magic}}</span>
      </div>
    </div>
    <div class="tile-value">{{value}} VP</div>
  </div>
</div>`,
    css: `
.tile {
  width: 100%;
  height: 100%;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Segoe UI', sans-serif;
  color: white;
  overflow: hidden;
  position: relative;
  border: 3px solid rgba(0, 0, 0, 0.3);
}

.tile-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 50%, rgba(0,0,0,0.2) 100%);
  pointer-events: none;
}

.tile.Forest { background: linear-gradient(135deg, #2d5a27, #1a3a18); border-color: #3a7a33; }
.tile.Mountain { background: linear-gradient(135deg, #5a5a5a, #3a3a3a); border-color: #7a7a7a; }
.tile.Plains { background: linear-gradient(135deg, #7a9a4a, #5a7a2a); border-color: #9aba5a; }
.tile.Desert { background: linear-gradient(135deg, #c4a44a, #a4842a); border-color: #e4c45a; }
.tile.Water { background: linear-gradient(135deg, #2a5a8a, #1a3a6a); border-color: #4a7aaa; }
.tile.Swamp { background: linear-gradient(135deg, #3a4a2a, #2a3a1a); border-color: #5a6a4a; }
.tile.Village { background: linear-gradient(135deg, #6a5a3a, #4a3a2a); border-color: #8a7a5a; }
.tile.Volcano { background: linear-gradient(135deg, #8a2a1a, #5a1a0a); border-color: #aa3a2a; }

.tile-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  position: relative;
  z-index: 1;
  padding: 8px;
  text-align: center;
}

.tile-icon {
  font-size: 28px;
  line-height: 1;
  text-shadow: 0 2px 4px rgba(0,0,0,0.5);
}

.tile-name {
  font-size: 13px;
  font-weight: 700;
  text-shadow: 0 1px 3px rgba(0,0,0,0.5);
  text-transform: uppercase;
  letter-spacing: 1px;
}

.tile-terrain {
  font-size: 9px;
  text-transform: uppercase;
  letter-spacing: 2px;
  opacity: 0.7;
  text-shadow: 0 1px 2px rgba(0,0,0,0.5);
}

.tile-resources {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2px 8px;
  margin: 4px 0;
}

.tile-resource {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
}

.res-icon {
  font-size: 14px;
}

.res-val {
  font-weight: 700;
  text-shadow: 0 1px 2px rgba(0,0,0,0.5);
}

.tile-value {
  font-size: 10px;
  font-weight: 700;
  color: #f1c40f;
  text-shadow: 0 1px 3px rgba(0,0,0,0.5);
  padding: 2px 8px;
  background: rgba(0,0,0,0.3);
  border-radius: 4px;
}`,
    sampleData: [
      { name: 'Greenwood', terrain: 'Forest', icon: '🌲', food: '2', ore: '0', wood: '3', magic: '0', value: '1' },
      { name: 'Iron Peak', terrain: 'Mountain', icon: '⛰️', food: '0', ore: '3', wood: '1', magic: '0', value: '2' },
      { name: 'Golden Fields', terrain: 'Plains', icon: '🌾', food: '3', ore: '0', wood: '0', magic: '0', value: '1' },
      { name: 'Sand Wastes', terrain: 'Desert', icon: '🏜️', food: '0', ore: '1', wood: '0', magic: '2', value: '1' },
      { name: 'Coral Reef', terrain: 'Water', icon: '🌊', food: '2', ore: '0', wood: '0', magic: '1', value: '2' },
    ],
  },
  {
    id: 'tcg',
    name: 'TCG / Cardfight',
    description: 'Classic trading card game layout with evolution, attacks, and retreat cost',
    cardSize: { widthMm: 63, heightMm: 88, bleedMm: 3 },
    html: `<div class="card tcg">
  <div class="tcg-stage {{stage}}">
    <span class="stage-label">{{stage}}</span>
  </div>
  <div class="tcg-header">
    <span class="tcg-name">{{name}}</span>
    <div class="tcg-hp">
      <span>HP</span>
      <span class="hp-value">{{hp}}</span>
    </div>
  </div>
  <div class="tcg-type-row">
    <span class="tcg-type {{type}}">{{type}}</span>
    <span class="tcg-evolves">{{evolves}}</span>
  </div>
  <div class="tcg-art">
    <img src="{{image}}" alt="{{name}}" />
  </div>
  <div class="tcg-ability" style="{{#if ability}}{{else}}display:none{{/if}}">
    <strong>{{abilityName}}</strong> {{abilityDesc}}
  </div>
  <div class="tcg-attack">
    <div class="attack-cost">
      <span class="energy {{cost1}}">{{cost1}}</span>
      <span class="energy {{cost2}}">{{cost2}}</span>
      <span class="energy {{cost3}}">{{cost3}}</span>
    </div>
    <span class="attack-name">{{attackName}}</span>
    <span class="attack-dmg">{{damage}}</span>
  </div>
  <div class="tcg-footer">
    <span class="tcg-retreat">Retreat: {{retreat}}</span>
    <span class="tcg-weakness">Weak: {{weakness}}</span>
  </div>
</div>`,
    css: `
.card.tcg {
  width: 100%;
  height: 100%;
  background: linear-gradient(180deg, #f5e6c8 0%, #e8d5a8 50%, #d4bf8a 100%);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  font-family: 'Arial', 'Helvetica', sans-serif;
  color: #2c1810;
  overflow: hidden;
  border: 3px solid #c4a050;
  box-shadow: inset 0 0 20px rgba(0,0,0,0.1);
}

.tcg-stage {
  padding: 3px 10px;
  text-align: center;
  font-size: 10px;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 2px;
}

.tcg-stage.Basic { background: linear-gradient(90deg, #8B4513, #A0522D); color: #fff; }
.tcg-stage.Stage1 { background: linear-gradient(90deg, #2E8B57, #3CB371); color: #fff; }
.tcg-stage.Stage2 { background: linear-gradient(90deg, #1E90FF, #4169E1); color: #fff; }
.tcg-stage.Mega { background: linear-gradient(90deg, #8B0000, #DC143C); color: #fff; }

.tcg-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 10px;
}

.tcg-name {
  font-weight: bold;
  font-size: 14px;
  color: #2c1810;
}

.tcg-hp {
  display: flex;
  align-items: center;
  gap: 2px;
  font-size: 11px;
  color: #c0392b;
}

.hp-value {
  font-size: 18px;
  font-weight: bold;
  color: #c0392b;
}

.tcg-type-row {
  display: flex;
  justify-content: space-between;
  padding: 2px 10px;
  font-size: 10px;
  color: #5a3d1f;
}

.tcg-type.Fire { color: #d35400; font-weight: bold; }
.tcg-type.Water { color: #2980b9; font-weight: bold; }
.tcg-type.Grass { color: #27ae60; font-weight: bold; }
.tcg-type.Lightning { color: #f39c12; font-weight: bold; }
.tcg-type.Psychic { color: #8e44ad; font-weight: bold; }
.tcg-type.Fighting { color: #c0392b; font-weight: bold; }
.tcg-type.Darkness { color: #2c3e50; font-weight: bold; }
.tcg-type.Metal { color: #7f8c8d; font-weight: bold; }
.tcg-type.Dragon { color: #e67e22; font-weight: bold; }
.tcg-type.Colorless { color: #7f8c8d; font-weight: bold; }

.tcg-evolves {
  color: #7f8c8d;
  font-style: italic;
}

.tcg-art {
  height: 100px;
  margin: 4px 10px;
  border-radius: 8px;
  overflow: hidden;
  border: 2px solid #c4a050;
  background: #d4bf8a;
}

.tcg-art img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.tcg-ability {
  padding: 4px 10px;
  font-size: 10px;
  line-height: 1.3;
  background: rgba(196, 160, 80, 0.2);
  margin: 2px 8px;
  border-radius: 4px;
  border-left: 3px solid #c4a050;
}

.tcg-attack {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  flex: 1;
  border-top: 1px solid rgba(196, 160, 80, 0.4);
  border-bottom: 1px solid rgba(196, 160, 80, 0.4);
  margin: 0 8px;
}

.attack-cost {
  display: flex;
  gap: 2px;
}

.energy {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 8px;
  font-weight: bold;
  color: #fff;
}

.energy.Fire { background: #e74c3c; }
.energy.Water { background: #3498db; }
.energy.Grass { background: #2ecc71; }
.energy.Lightning { background: #f1c40f; }
.energy.Psychic { background: #9b59b6; }
.energy.Fighting { background: #e67e22; }
.energy.Darkness { background: #34495e; }
.energy.Metal { background: #95a5a6; }
.energy.Dragon { background: linear-gradient(135deg, #e74c3c, #3498db); }
.energy.Colorless { background: #bdc3c7; }

.attack-name {
  flex: 1;
  font-size: 11px;
  font-weight: bold;
}

.attack-dmg {
  font-size: 18px;
  font-weight: bold;
  color: #2c1810;
}

.tcg-footer {
  display: flex;
  justify-content: space-between;
  padding: 4px 10px;
  font-size: 10px;
  color: #5a3d1f;
}

.tcg-retreat, .tcg-weakness {
  display: flex;
  align-items: center;
  gap: 4px;
}`,
    sampleData: [
      { name: 'Flaming Dragon', stage: 'Stage2', hp: '150', type: 'Fire', evolves: 'Evolves from Fire Drake', attackName: 'Inferno Blast', cost1: 'Fire', cost2: 'Fire', cost3: 'Colorless', damage: '120', abilityName: 'Blaze Aura', abilityDesc: 'All Fire-type attacks deal +20 damage.', retreat: '2', weakness: 'Water', image: 'assets/dragon.png' },
      { name: 'Aqua Turtle', stage: 'Stage1', hp: '110', type: 'Water', evolves: 'Evolves from Squirturtle', attackName: 'Hydro Pump', cost1: 'Water', cost2: 'Water', cost3: '', damage: '70', abilityName: 'Shell Shield', abilityDesc: 'Reduce damage from attacks by 10.', retreat: '1', weakness: 'Grass', image: 'assets/turtle.png' },
      { name: 'Thunder Bird', stage: 'Basic', hp: '90', type: 'Lightning', evolves: '-', attackName: 'Thunderbolt', cost1: 'Lightning', cost2: 'Colorless', cost3: '', damage: '50', abilityName: '', abilityDesc: '', retreat: '0', weakness: 'Fighting', image: 'assets/bird.png' },
    ],
  },
  {
    id: 'core',
    name: 'Core',
    description: 'Classic header/art/type/description layout — the standard TCG structure',
    cardSize: { widthMm: 63, heightMm: 88, bleedMm: 3 },
    html: `<div class="card-core">
  <div class="core-header">{{name}}</div>
  <div class="core-art">
    <div class="core-art-placeholder">{{type}}</div>
  </div>
  <div class="core-type">{{type}}</div>
  <div class="core-description">{{description}}</div>
  <div class="core-footer">
    <span>{{faction}}</span>
    <span>{{id}}</span>
  </div>
</div>`,
    css: `
.card-core {
  width: 100%; height: 100%;
  display: flex; flex-direction: column;
  background: linear-gradient(160deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  color: #e0e0e0;
  font-family: 'Segoe UI', sans-serif;
  overflow: hidden;
}
.core-header {
  background: linear-gradient(90deg, rgba(255,255,255,0.12), rgba(255,255,255,0.05));
  padding: 12px 16px;
  font-size: 15px; font-weight: 700;
  text-align: center;
  letter-spacing: 0.5px;
  border-bottom: 1px solid rgba(255,255,255,0.1);
}
.core-art {
  flex: 1;
  display: flex; align-items: center; justify-content: center;
  background: rgba(255,255,255,0.04);
  margin: 8px;
  border-radius: 8px;
  overflow: hidden;
}
.core-art-placeholder {
  font-size: 12px; text-transform: uppercase;
  color: rgba(255,255,255,0.25);
  letter-spacing: 2px;
}
.core-type {
  background: linear-gradient(90deg, rgba(255,255,255,0.08), transparent);
  padding: 10px 16px;
  font-size: 11px; text-transform: uppercase;
  letter-spacing: 1.5px; text-align: center;
  color: rgba(255,255,255,0.6);
}
.core-description {
  padding: 14px 16px;
  font-size: 11px; line-height: 1.5;
  color: rgba(255,255,255,0.8);
  flex: 0 0 auto;
  min-height: 64px;
}
.core-footer {
  padding: 8px 16px;
  display: flex; justify-content: space-between;
  font-size: 10px;
  color: rgba(255,255,255,0.4);
  border-top: 1px solid rgba(255,255,255,0.06);
}`,
    sampleData: [
      { name: 'Keeper of the Core', type: 'Ancient Brewer', description: 'The brewer is a very important card in the game. It allows you to brew potions and create powerful effects.', faction: 'Ciderians', id: '001' },
      { name: 'Shadow Weaver', type: 'Mystic Creature', description: 'Weaves shadows into powerful fabrics that can shield allies or entangle foes.', faction: 'Night Council', id: '042' },
    ],
  },
  {
    id: 'mire',
    name: 'Mire',
    description: 'Badge overlay on art area, banner type bar — great for tokens and counters',
    cardSize: { widthMm: 63, heightMm: 88, bleedMm: 3 },
    html: `<div class="card-mire">
  <div class="mire-header">{{name}}</div>
  <div class="mire-badge">{{badge}}</div>
  <div class="mire-art">
    <div class="mire-art-placeholder">{{type}}</div>
  </div>
  <div class="mire-type">{{type}}</div>
  <div class="mire-description">{{description}}</div>
  <div class="mire-footer">
    <span>{{faction}}</span>
    <span>{{id}}</span>
  </div>
</div>`,
    css: `
.card-mire {
  width: 100%; height: 100%;
  display: flex; flex-direction: column;
  background: linear-gradient(160deg, #1b1b1b 0%, #2d1f1a 50%, #1a1a1a 100%);
  color: #d4c5a9;
  font-family: 'Segoe UI', sans-serif;
  overflow: hidden;
  position: relative;
}
.mire-header {
  background: linear-gradient(90deg, rgba(180,140,100,0.2), rgba(180,140,100,0.05));
  padding: 12px 16px;
  font-size: 15px; font-weight: 700;
  text-align: center;
  border-bottom: 1px solid rgba(180,140,100,0.15);
}
.mire-badge {
  position: absolute;
  top: 52px; left: 12px;
  width: 36px; height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, #c0392b, #e74c3c);
  display: flex; align-items: center; justify-content: center;
  font-size: 16px; font-weight: 800;
  color: #fff; z-index: 2;
  box-shadow: 0 2px 8px rgba(0,0,0,0.4);
}
.mire-art {
  flex: 1;
  display: flex; align-items: center; justify-content: center;
  background: rgba(255,255,255,0.03);
  margin: 8px;
  border-radius: 8px;
}
.mire-art-placeholder {
  font-size: 12px; text-transform: uppercase;
  color: rgba(255,255,255,0.2);
  letter-spacing: 2px;
}
.mire-type {
  background: linear-gradient(90deg, rgba(180,140,100,0.1), transparent);
  padding: 8px 16px;
  font-size: 10px; text-transform: uppercase;
  letter-spacing: 1.5px; text-align: center;
  color: rgba(212,197,169,0.5);
  width: 70%; margin: 0 auto -20px; z-index: 1;
}
.mire-description {
  padding: 24px 16px 14px;
  font-size: 11px; line-height: 1.5;
  color: rgba(212,197,169,0.75);
  min-height: 72px;
}
.mire-footer {
  padding: 8px 16px;
  display: flex; justify-content: space-between;
  font-size: 10px;
  color: rgba(212,197,169,0.35);
  border-top: 1px solid rgba(180,140,100,0.08);
}`,
    sampleData: [
      { name: 'Bog Witch', type: 'Swamp Creature', description: 'Commands the murky waters and the creatures that dwell within.', badge: '3', faction: 'Mirefolk', id: '017' },
      { name: 'Rotting Knight', type: 'Undead', description: 'Once a proud warrior, now serves the swamp as an eternal guardian.', badge: '5', faction: 'Mirefolk', id: '023' },
    ],
  },
  {
    id: 'mystic',
    name: 'Mystic',
    description: 'TCG-style with cost symbols, bordered art, type line, and ATK/DEF stats',
    cardSize: { widthMm: 63, heightMm: 88, bleedMm: 3 },
    html: `<div class="card-mystic">
  <div class="mystic-header">
    <span>{{name}}</span>
    <span class="mystic-cost">{{cost}}</span>
  </div>
  <div class="mystic-art">
    <div class="mystic-art-placeholder">{{type}}</div>
  </div>
  <div class="mystic-type">
    <span>{{type}} — {{magicks}}</span>
  </div>
  <div class="mystic-description">{{description}}</div>
  <div class="mystic-stats">
    <div class="mystic-stat">
      <span class="mystic-stat-label">ATK</span>
      <span class="mystic-stat-value">{{attack}}</span>
    </div>
    <div class="mystic-stat">
      <span class="mystic-stat-label">DEF</span>
      <span class="mystic-stat-value">{{defense}}</span>
    </div>
  </div>
  <div class="mystic-footer">
    <span>{{faction}}</span>
    <span>{{id}}</span>
  </div>
</div>`,
    css: `
.card-mystic {
  width: 100%; height: 100%;
  display: flex; flex-direction: column;
  background: linear-gradient(160deg, #0d0d2b 0%, #1a1040 50%, #0d0d2b 100%);
  color: #c8c0e0;
  font-family: 'Segoe UI', sans-serif;
  overflow: hidden;
}
.mystic-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 10px 14px;
  font-size: 14px; font-weight: 700;
  background: linear-gradient(90deg, rgba(120,80,200,0.15), transparent);
  border-bottom: 1px solid rgba(120,80,200,0.15);
}
.mystic-cost {
  display: flex; align-items: center; gap: 4px;
  font-size: 16px; font-weight: 800;
  color: #f0c060;
}
.mystic-art {
  flex: 1;
  display: flex; align-items: center; justify-content: center;
  margin: 6px 10px;
  border: 2px solid rgba(120,80,200,0.3);
  border-radius: 10px;
  background: rgba(255,255,255,0.03);
}
.mystic-art-placeholder {
  font-size: 11px; text-transform: uppercase;
  color: rgba(255,255,255,0.2);
  letter-spacing: 2px;
}
.mystic-type {
  display: flex; justify-content: space-between; align-items: center;
  padding: 8px 16px;
  font-size: 10px; text-transform: uppercase;
  letter-spacing: 1px;
  color: rgba(200,192,224,0.5);
  background: rgba(255,255,255,0.04);
}
.mystic-description {
  padding: 12px 16px;
  font-size: 11px; line-height: 1.5;
  color: rgba(200,192,224,0.75);
  flex: 0 0 auto;
  min-height: 56px;
}
.mystic-stats {
  display: flex; gap: 24px; justify-content: center;
  padding: 8px;
  background: rgba(0,0,0,0.2);
  border-top: 1px solid rgba(120,80,200,0.1);
  border-bottom: 1px solid rgba(120,80,200,0.1);
  margin: 0 24px;
}
.mystic-stat {
  display: flex; align-items: center; gap: 6px;
}
.mystic-stat-label {
  font-size: 9px; text-transform: uppercase;
  color: rgba(200,192,224,0.4);
  letter-spacing: 1px;
}
.mystic-stat-value {
  font-size: 16px; font-weight: 800;
  color: #f0c060;
}
.mystic-footer {
  padding: 8px 16px;
  display: flex; justify-content: space-between;
  font-size: 10px;
  color: rgba(200,192,224,0.3);
  border-top: 1px solid rgba(120,80,200,0.06);
}`,
    sampleData: [
      { name: 'Ancient Brewer', cost: '3', type: 'Creature', magicks: 'Arcane', description: 'The brewer is a very important card in the game. It allows you to brew potions.', attack: '4', defense: '3', faction: 'Ciderians', id: '007' },
      { name: 'Storm Mage', cost: '5', type: 'Mage', magicks: 'Tempest', description: 'Commands the lightning and thunder. Unleashes devastating storms upon foes.', attack: '6', defense: '2', faction: 'Skyhold', id: '031' },
    ],
  },
  {
    id: 'arcane',
    name: 'Arcane',
    description: 'Art at the top, header below, triple badge layout — for complex spell cards',
    cardSize: { widthMm: 63, heightMm: 88, bleedMm: 3 },
    html: `<div class="card-arcane">
  <div class="arcane-badge">{{badge1}}</div>
  <div class="arcane-art">
    <div class="arcane-art-placeholder">{{type}}</div>
  </div>
  <div class="arcane-header">{{name}}</div>
  <div class="arcane-badge-row">
    <span class="arcane-badge-sm">{{badge2}}</span>
    <span class="arcane-badge-sm">{{badge3}}</span>
  </div>
  <div class="arcane-type">{{type}} — {{magicks}}</div>
  <div class="arcane-description">{{description}}</div>
  <div class="arcane-footer">
    <span>{{faction}}</span>
    <span>{{id}}</span>
  </div>
</div>`,
    css: `
.card-arcane {
  width: 100%; height: 100%;
  display: flex; flex-direction: column;
  background: linear-gradient(160deg, #0a0a1a 0%, #1a0a2e 50%, #0a0a1a 100%);
  color: #e0d0f0;
  font-family: 'Segoe UI', sans-serif;
  overflow: hidden;
  position: relative;
}
.arcane-badge {
  position: absolute;
  top: 8px; left: 8px;
  width: 32px; height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #6c5ce7, #a29bfe);
  display: flex; align-items: center; justify-content: center;
  font-size: 14px; font-weight: 800;
  color: #fff; z-index: 2;
  box-shadow: 0 2px 8px rgba(108,92,231,0.5);
}
.arcane-art {
  flex: 1;
  display: flex; align-items: center; justify-content: center;
  background: rgba(255,255,255,0.03);
  margin: 8px 8px 4px;
  border-radius: 8px;
  min-height: 80px;
}
.arcane-art-placeholder {
  font-size: 11px; text-transform: uppercase;
  color: rgba(255,255,255,0.18);
  letter-spacing: 2px;
}
.arcane-header {
  padding: 8px 14px 4px 14px;
  font-size: 14px; font-weight: 700;
  text-align: left;
  padding-left: 28px;
  color: #c8b0e8;
}
.arcane-badge-row {
  display: flex; gap: 8px;
  justify-content: flex-end;
  padding: 0 14px;
  margin-top: -8px;
}
.arcane-badge-sm {
  width: 28px; height: 28px;
  border-radius: 50%;
  background: linear-gradient(135deg, #6c5ce7, #a29bfe);
  display: flex; align-items: center; justify-content: center;
  font-size: 12px; font-weight: 700;
  color: #fff; z-index: 2;
  box-shadow: 0 2px 6px rgba(108,92,231,0.4);
}
.arcane-type {
  text-align: center;
  font-size: 10px; text-transform: uppercase;
  letter-spacing: 1px;
  color: rgba(224,208,240,0.4);
  padding: 4px 0;
  margin-top: -4px;
}
.arcane-description {
  padding: 12px 16px;
  font-size: 11px; line-height: 1.5;
  color: rgba(224,208,240,0.7);
  min-height: 60px;
  flex: 0 0 auto;
}
.arcane-footer {
  padding: 8px 16px;
  display: flex; justify-content: space-between;
  font-size: 10px;
  color: rgba(224,208,240,0.3);
  border-top: 1px solid rgba(108,92,231,0.08);
}`,
    sampleData: [
      { name: 'Arcane Blast', badge1: '5', badge2: '2', badge3: '3', type: 'Spell', magicks: 'Destruction', description: 'Unleashes a powerful burst of arcane energy that devastates all enemies.', faction: 'Arcane Order', id: '099' },
      { name: 'Mystic Barrier', badge1: '3', badge2: '1', badge3: '1', type: 'Enchantment', magicks: 'Protection', description: 'Creates a shimmering barrier that protects allies from incoming damage.', faction: 'Arcane Order', id: '104' },
    ],
  },
  {
    id: 'keep',
    name: 'Keep',
    description: 'Minimal layout — header, badge, full art area, footer. Perfect for locations',
    cardSize: { widthMm: 63, heightMm: 88, bleedMm: 3 },
    html: `<div class="card-keep">
  <div class="keep-header">{{name}}</div>
  <div class="keep-badge">{{badge}}</div>
  <div class="keep-art">
    <div class="keep-art-placeholder">{{type}}</div>
  </div>
  <div class="keep-footer">
    <span>{{faction}}</span>
    <span>{{id}}</span>
  </div>
</div>`,
    css: `
.card-keep {
  width: 100%; height: 100%;
  display: flex; flex-direction: column;
  background: linear-gradient(160deg, #2c2c2c 0%, #1a1a1a 50%, #2c2c2c 100%);
  color: #c0c0c0;
  font-family: 'Segoe UI', sans-serif;
  overflow: hidden;
  position: relative;
}
.keep-header {
  background: linear-gradient(90deg, rgba(255,255,255,0.08), transparent);
  padding: 14px 16px;
  font-size: 16px; font-weight: 700;
  text-align: center;
  letter-spacing: 0.5px;
  border-bottom: 1px solid rgba(255,255,255,0.06);
}
.keep-badge {
  position: absolute;
  top: 56px; left: 12px;
  width: 34px; height: 34px;
  border-radius: 50%;
  background: linear-gradient(135deg, #e67e22, #f39c12);
  display: flex; align-items: center; justify-content: center;
  font-size: 15px; font-weight: 800;
  color: #fff; z-index: 2;
  box-shadow: 0 2px 8px rgba(0,0,0,0.5);
}
.keep-art {
  flex: 1;
  display: flex; align-items: center; justify-content: center;
  margin: 8px;
  border-radius: 8px;
  background: rgba(255,255,255,0.03);
}
.keep-art-placeholder {
  font-size: 12px; text-transform: uppercase;
  color: rgba(255,255,255,0.18);
  letter-spacing: 2px;
}
.keep-footer {
  padding: 10px 16px;
  display: flex; justify-content: space-between;
  font-size: 10px;
  color: rgba(255,255,255,0.3);
  border-top: 1px solid rgba(255,255,255,0.06);
}`,
    sampleData: [
      { name: 'The Iron Keep', badge: '7', type: 'Location', faction: 'Northern Realms', id: 'K01' },
      { name: 'Sunken Temple', badge: '4', type: 'Location', faction: 'Ancient Ones', id: 'K07' },
    ],
  },
  {
    id: 'trick',
    name: 'Trick',
    description: 'Playing-card style with rank/suit symbols — for card games, roguelikes, and decks',
    cardSize: { widthMm: 63, heightMm: 88, bleedMm: 3 },
    html: `<div class="card-trick">
  <div class="trick-header">
    <div class="trick-suit-stack">
      <div class="trick-rank">{{rank}}</div>
      <div class="trick-suit">{{suit}}</div>
    </div>
    <div class="trick-name-stack">
      <div class="trick-name">{{name}}</div>
      <div class="trick-desc">{{description}}</div>
    </div>
  </div>
  <div class="trick-art">
    <div class="trick-art-placeholder">{{suit}}</div>
  </div>
  <div class="trick-footer">
    <div class="trick-suit-stack">
      <div class="trick-rank">{{rank}}</div>
      <div class="trick-suit">{{suit}}</div>
    </div>
    <div class="trick-name-stack">
      <div class="trick-name">{{name}}</div>
      <div class="trick-desc">{{description}}</div>
    </div>
  </div>
</div>`,
    css: `
.card-trick {
  width: 100%; height: 100%;
  display: flex; flex-direction: column;
  background: linear-gradient(160deg, #f5f0e8 0%, #e8e0d0 100%);
  color: #2c1810;
  font-family: 'Segoe UI', sans-serif;
  overflow: hidden;
  padding: 6px;
}
.trick-header {
  display: flex; gap: 8px;
  flex-shrink: 0;
}
.trick-suit-stack {
  display: flex; flex-direction: column; align-items: center;
  min-width: 36px;
}
.trick-rank {
  font-size: 22px; font-weight: 800;
  line-height: 1;
}
.trick-suit {
  font-size: 18px;
  line-height: 1;
  margin-top: 2px;
  color: #c0392b;
}
.trick-name-stack {
  display: flex; flex-direction: column;
  flex: 1;
  background: rgba(255,255,255,0.5);
  border-radius: 6px;
  padding: 6px 10px;
  border: 1px solid rgba(0,0,0,0.06);
}
.trick-name {
  font-size: 12px; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.5px;
}
.trick-desc {
  font-size: 9px;
  color: rgba(44,24,16,0.5);
  line-height: 1.3;
  overflow: hidden;
  max-height: 28px;
}
.trick-art {
  flex: 1;
  display: flex; align-items: center; justify-content: center;
  margin: 6px 0;
  border-radius: 8px;
  background: linear-gradient(135deg, rgba(192,57,43,0.05), rgba(192,57,43,0.1));
  border: 1px solid rgba(192,57,43,0.1);
}
.trick-art-placeholder {
  font-size: 48px;
  color: rgba(192,57,43,0.15);
}
.trick-footer {
  display: flex; gap: 8px;
  transform: rotate(180deg);
  flex-shrink: 0;
}`,
    sampleData: [
      { name: 'Ace of Hearts', rank: 'A', suit: '♥', description: 'The heart of all cards — wild and unpredictable.' },
      { name: 'Jester King', rank: 'J', suit: '♠', description: 'The king of tricks and deception.' },
    ],
  },
  {
    id: 'blank',
    name: 'Blank',
    description: 'Empty canvas — start from scratch with no predefined layout',
    cardSize: { widthMm: 63, heightMm: 88, bleedMm: 3 },
    html: `<div class="card-blank">
  <div class="blank-content">{{content}}</div>
</div>`,
    css: `
.card-blank {
  width: 100%; height: 100%;
  background: var(--mica-layer-1, #f0f0f0);
  display: flex; align-items: center; justify-content: center;
  border: 2px dashed var(--mica-stroke, #ccc);
  border-radius: 12px;
}
.blank-content {
  font-size: 12px;
  color: var(--mica-text-tertiary, #999);
  text-align: center;
  padding: 16px;
}`,
    sampleData: [
      { content: 'Design your card here' },
    ],
  },
];

export function getTemplateById(id: string): CardTemplate | undefined {
  return cardTemplates.find(t => t.id === id);
}

export function getTemplateNames(): { id: string; name: string; description: string }[] {
  return cardTemplates.map(t => ({ id: t.id, name: t.name, description: t.description }));
}