# Spécification Détaillée des Modifications — Mode Édition & Création Manuelle

**Projet :** DCC Assistant (Dungeon Crawl Classics RPG)  
**Phase :** Phase 3 — Description détaillée des changements  
**Date :** 21 novembre 2026  
**Livrable :** `notes/spec-detaillee-edition-fiche.md`  
**Fichier cible de l'application :** `index.html`  
**Fichier de tests cible :** `tests/adventurers.test.mjs` (ou nouveau test dédié)

---

## 1. Vue d'Ensemble des Modifications

L'ensemble des modifications s'effectue dans le fichier unique `index.html` (sans aucun bundler ni dépendance npm), complété par des tests automatisés dans `tests/`.

| Composant | Lignes approx. dans `index.html` | Nature de la modification |
| :--- | :--- | :--- |
| **CSS** | ~L1720 (fin des styles de cartes) | Ajout des classes `.char-card-editing`, `.badge-editing`, `.card-header-actions`, `.edit-form-*` et responsive |
| **HTML** | ~L2422 (`.actions-toolbar`) | Ajout du bouton `#btnNewAdventurer` |
| **HTML** | ~L2503 (`#adventurerEmptyState`) | Ajout du bouton `#btnEmptyNewAdventurer` |
| **JS Règles (Sec. 3b)** | ~L4500 | Ajout de la fonction pure `createBlankAdventurer()` et export dans `globalThis.DCC_RULES` |
| **JS App (Sec. 4)** | ~L5125 (Constructeur `DCCApp`) | Initialisation de `this.editingCharacterIds = new Set()` et `this.characterSnapshots = new Map()` |
| **JS App (Sec. 4)** | ~L5315 (`initElements`) | Récupération des éléments `#btnNewAdventurer` et `#btnEmptyNewAdventurer` |
| **JS App (Sec. 4)** | ~L5330 (`bindEvents`) | Câblage des événements de clic sur la création d'aventurier |
| **JS App (Sec. 4)** | ~L6485 (`render`) | Affichage/masquage contextuel de `#btnNewAdventurer` selon l'onglet actif |
| **JS App (Sec. 4)** | ~L6685 (`createCharacterCard`) | Intégration du bouton `✏️ Modifier` et branchement vers le rendu édition pour Niveau 0 |
| **JS App (Sec. 4)** | ~L7750 (`createAdventurerCard`) | Intégration du bouton `✏️ Modifier` et branchement vers le rendu édition pour Aventurier |
| **JS App (Sec. 4)** | Méthodes ajoutées dans `DCCApp` | `renderCharacterCardEdit(char)`, `renderAdventurerCardEdit(char)`, `bindEditFormControls(card, char)`, `startEditing(charId)`, `cancelEditing(charId)`, `saveEditing(charId, card)`, `handleNewAdventurer()` |

---

## 2. Modifications CSS détaillées

### Emplacement : avant la règle `@page` (~ligne 1720)

```css
    /* ==========================================================================
       Mode Édition des Fiches (Niveau 0 & Aventuriers)
       ========================================================================== */
    .card-header-actions {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      margin-left: auto;
    }

    .btn-edit-card,
    .btn-save-edit,
    .btn-cancel-edit {
      padding: 0.2rem 0.5rem;
      font-size: 0.75rem;
      line-height: 1.2;
      border-radius: 3px;
      cursor: pointer;
      font-family: inherit;
    }

    .char-card.char-card-editing {
      border: 2px solid var(--accent-gold) !important;
      box-shadow: 0 0 12px rgba(212, 175, 55, 0.35), inset 0 0 8px rgba(212, 175, 55, 0.1);
      background: linear-gradient(to bottom, #24222a, #1a1921);
    }

    .badge-editing {
      display: inline-block;
      background: var(--accent-gold);
      color: #111;
      font-size: 0.65rem;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 0.15rem 0.4rem;
      border-radius: 3px;
    }

    .edit-form-container {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      margin-top: 0.75rem;
      font-size: 0.85rem;
    }

    .edit-form-section {
      background: rgba(0, 0, 0, 0.25);
      border: 1px solid #3d3b45;
      border-radius: 4px;
      padding: 0.6rem 0.75rem;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .edit-section-title {
      font-family: 'Cinzel', serif;
      font-size: 0.8rem;
      color: var(--accent-gold);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-bottom: 1px solid rgba(212, 175, 55, 0.2);
      padding-bottom: 0.25rem;
      margin-bottom: 0.25rem;
    }

    .edit-row {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      align-items: center;
    }

    .edit-field {
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
      flex: 1 1 120px;
    }

    .edit-field-sm {
      flex: 0 1 70px;
    }

    .edit-field-full {
      flex: 1 1 100%;
    }

    .edit-label {
      font-size: 0.7rem;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .edit-input,
    .edit-select,
    .edit-textarea {
      background: #141318;
      color: var(--text-light);
      border: 1px solid #4a4755;
      border-radius: 3px;
      padding: 0.3rem 0.45rem;
      font-family: inherit;
      font-size: 0.85rem;
      width: 100%;
      box-sizing: border-box;
    }

    .edit-input:focus,
    .edit-select:focus,
    .edit-textarea:focus {
      outline: none;
      border-color: var(--accent-gold);
      box-shadow: 0 0 5px rgba(212, 175, 55, 0.5);
    }

    .edit-spells-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
      gap: 0.35rem;
      max-height: 200px;
      overflow-y: auto;
      padding: 0.4rem;
      background: #121116;
      border: 1px solid #333;
      border-radius: 3px;
    }

    .edit-spell-checkbox {
      display: flex;
      align-items: center;
      gap: 0.35rem;
      font-size: 0.75rem;
      cursor: pointer;
    }

    .edit-spell-checkbox input {
      accent-color: var(--accent-gold);
    }
```

---

## 3. Modifications HTML détaillées

### 3.1. Bouton « ➕ Nouvel aventurier » dans `.actions-toolbar` (~L2422)

```html
<!-- AVANT -->
      <div class="actions-toolbar">
        <button id="btnGenOne" class="btn btn-primary" title="Créer un nouveau paysan">
          <span>+1</span> Paysan
        </button>
...

<!-- APRÈS -->
      <div class="actions-toolbar">
        <button id="btnGenOne" class="btn btn-primary" title="Créer un nouveau paysan">
          <span>+1</span> Paysan
        </button>
        <button id="btnGenFour" class="btn btn-gold" title="Générer les 4 paysans d'un joueur">
          <span>⚡</span> Escouade (4)
        </button>
        <button id="btnGenSixteen" class="btn btn-secondary" title="Générer 16 paysans pour toute une table de jeu">
          <span>🎲</span> Table entière (16)
        </button>
        <button id="btnNewAdventurer" class="btn btn-gold" title="Créer un nouvel aventurier de niveau 1+" hidden>
          <span>➕</span> Nouvel aventurier
        </button>
        <button id="btnPrint" class="btn btn-secondary"
```

### 3.2. Bouton dans l'état vide d'aventuriers (`#adventurerEmptyState`, ~L2503)

```html
<!-- AVANT -->
      <div id="adventurerEmptyState" class="empty-state" style="display: none;">
        <h2>Aucun aventurier</h2>
        <p>Aucun aventurier : un survivant avec 10 PX peut passer au niveau 1 depuis l'onglet Niveau 0.</p>
      </div>

<!-- APRÈS -->
      <div id="adventurerEmptyState" class="empty-state" style="display: none;">
        <h2>Aucun aventurier</h2>
        <p>Aucun aventurier : un survivant avec 10 PX peut passer au niveau 1 depuis l'onglet Niveau 0, ou vous pouvez en créer un directement.</p>
        <button type="button" id="btnEmptyNewAdventurer" class="btn btn-gold" style="margin-top: 1rem;">
          <span>➕</span> Créer un aventurier
        </button>
      </div>
```

---

## 4. Modifications JavaScript (Section Règles : Section 3b)

### 4.1. Fonction pure `createBlankAdventurer` (~L4500)

```javascript
      function createBlankAdventurer(customProps = {}) {
        const id = 'char_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
        const stats = {
          strength: { score: 10, mod: 0 },
          agility: { score: 10, mod: 0 },
          stamina: { score: 10, mod: 0 },
          personality: { score: 10, mod: 0 },
          intelligence: { score: 10, mod: 0 },
          luck: { score: 10, initialScore: 10, mod: 0 }
        };
        const weapon = {
          name: 'Épée courte',
          damage: '1d6',
          attackType: 'melee',
          twoHanded: false
        };
        const luckySign = LUCKY_SIGNS_DATA[0] || {
          roll: 1,
          name: 'Âme dure',
          description: 'Jets de vigueur'
        };

        const char = {
          id,
          name: 'Nouvel Aventurier',
          race: 'Humain',
          className: 'warrior',
          level: 1,
          customTitle: '',
          alignment: 'Neutre',
          xp: 10,
          currentHp: 10,
          maxHp: 10,
          ac: 10,
          speed: 9,
          baseSpeed: 9,
          armorId: 'none',
          hasShield: false,
          stats,
          weapon,
          startingWeapon: weapon,
          luckySign: {
            roll: luckySign.roll,
            name: luckySign.name,
            description: luckySign.description,
            modifier: 0
          },
          knownLanguages: ['Commun'],
          coinPurse: { cp: 0, sp: 0, ep: 0, gp: 10, pp: 0 },
          startingItem: 'Sac à dos, torche (2)',
          notes: '',
          classData: {},
          daily: defaultDaily(),
          hpHistory: [{ level: 1, die: 'd10', roll: 10, mod: 0, gain: 10 }],
          levelHistory: [{ level: 1, className: 'warrior', at: new Date().toISOString() }],
          ...customProps
        };

        syncLegacyStatus(char);
        return normalizeAdventurer(char);
      }
```

### 4.2. Export dans `globalThis.DCC_RULES` (~L8120)

Ajouter `createBlankAdventurer` à l'objet exporté :
```javascript
      globalThis.DCC_RULES = Object.freeze({
        ...
        createBlankAdventurer,
        ...
      });
```

---

## 5. Modifications JavaScript (Section App : `DCCApp`)

### 5.1. Constructeur `DCCApp` (~L5125)
Initialisation des structures d'état :
```javascript
        this.editingCharacterIds = new Set();
        this.characterSnapshots = new Map();
```

### 5.2. `initElements` (~L5315)
```javascript
        this.btnNewAdventurer = document.getElementById('btnNewAdventurer');
        this.btnEmptyNewAdventurer = document.getElementById('btnEmptyNewAdventurer');
```

### 5.3. `bindEvents` (~L5330)
```javascript
        if (this.btnNewAdventurer) {
          this.btnNewAdventurer.addEventListener('click', () => this.handleNewAdventurer());
        }
        if (this.btnEmptyNewAdventurer) {
          this.btnEmptyNewAdventurer.addEventListener('click', () => this.handleNewAdventurer());
        }
```

### 5.4. `render` (~L6485)
Mise à jour de l'affichage du bouton de création :
```javascript
        if (this.btnNewAdventurer) {
          this.btnNewAdventurer.hidden = !isAdv;
        }
```

### 5.5. Intégration du Mode Édition dans `createCharacterCard` (~L6685)
Dans `card-subline`, ajouter les boutons d'édition :
```javascript
          const isEditing = this.editingCharacterIds.has(char.id);
          if (isEditing) {
            card.classList.add('char-card-editing');
            card.innerHTML = this.renderCharacterCardEdit(char, statusInfo);
            this.bindCharacterEditControls(card, char);
            return card;
          }
```
Dans l'en-tête du mode normal, insérer le bouton `✏️ Modifier` à côté du badge de statut :
```html
          <div class="card-subline">
            <label class="char-alignment">Align. :
              <select class="alignment-select" aria-label="Alignement">
                ${ALIGNMENTS.map(alignment => `<option value="${alignment}" ${char.alignment === alignment ? 'selected' : ''}>${alignment}</option>`).join('')}
              </select>
            </label>
            <span class="badge-status status-${statusInfo.code}">${this.escapeHtml(statusInfo.label)}</span>
            <div class="card-header-actions">
              <button type="button" class="btn btn-secondary btn-sm btn-edit-card" data-id="${char.id}" title="Modifier cette fiche">✏️ Modifier</button>
            </div>
          </div>
```
Et brancher l'écouteur :
```javascript
          const editBtn = card.querySelector('.btn-edit-card');
          if (editBtn) editBtn.addEventListener('click', () => this.startEditing(char.id));
```

### 5.6. Intégration du Mode Édition dans `createAdventurerCard` (~L7750)
Similairement pour les aventuriers :
```javascript
          const isEditing = this.editingCharacterIds.has(char.id);
          if (isEditing) {
            card.classList.add('char-card-editing');
            card.innerHTML = this.renderAdventurerCardEdit(char, statusInfo);
            this.bindAdventurerEditControls(card, char);
            return card;
          }
```
Dans `card-subline` du mode normal :
```html
          <div class="card-subline">
            <span class="char-alignment">${esc(char.alignment)}${allegiance ? ` · ${esc(allegiance)}` : ''} · ${esc(char.race)}</span>
            <span class="badge-status status-${code}">${esc(statusInfo.label)}</span>
            <div class="card-header-actions">
              <button type="button" class="btn btn-secondary btn-sm btn-edit-card" data-id="${char.id}" title="Modifier cette fiche">✏️ Modifier</button>
            </div>
          </div>
```
Et brancher l'écouteur :
```javascript
          const editBtn = card.querySelector('.btn-edit-card');
          if (editBtn) editBtn.addEventListener('click', () => this.startEditing(char.id));
```

---

## 6. Méthodes de Gestion de l'Édition (`DCCApp`)

### 6.1. Méthodes de Contrôle du Cycle de Vie
```javascript
        startEditing(charId) {
          const char = this.findCharacter(charId);
          if (!char) return;
          this.characterSnapshots.set(charId, structuredClone(char));
          this.editingCharacterIds.add(charId);
          this.render();
        }

        cancelEditing(charId) {
          const char = this.findCharacter(charId);
          if (char && char._isNew) {
            this.characters = this.characters.filter(c => c.id !== charId);
          } else if (this.characterSnapshots.has(charId)) {
            const snapshot = this.characterSnapshots.get(charId);
            this.replaceCharacter(snapshot);
          }
          this.characterSnapshots.delete(charId);
          this.editingCharacterIds.delete(charId);
          this.saveState();
          this.render();
        }

        handleNewAdventurer() {
          const newAdv = createBlankAdventurer();
          newAdv._isNew = true;
          this.characters.push(newAdv);
          this.characterSnapshots.set(newAdv.id, structuredClone(newAdv));
          this.editingCharacterIds.add(newAdv.id);
          this.setActiveTab('adventurers');
          this.saveState();
          this.render();
          setTimeout(() => {
            const cardEl = this.adventurerGrid.querySelector(`[data-id="${newAdv.id}"]`);
            if (cardEl) cardEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }, 50);
        }
```

### 6.2. `saveCharacterEdit(charId, card)` (Niveau 0)
1. Récupère les inputs du formulaire dans `card`.
2. Met à jour :
   - `name`, `race`, `occupation`, `alignment`, `knownLanguages`.
   - Caractéristiques brutes (3–18) : `strength`, `agility`, `stamina`, `personality`, `intelligence`, `luck.score`, `luck.initialScore`.
   - Modificateurs recalculés : `stat.mod = getModifier(stat.score)`.
   - `currentHp`, `maxHp`, `speed`, `baseSpeed`, `armorId`, `hasShield`, `weapon`.
   - Recalcul de la CA et de l'initiative selon les règles.
   - Monnaie (`coinPurse.cp`), `startingItem`, `notes`.
3. Met à jour le statut `syncLegacyStatus(char)`.
4. Supprime `_isNew` si présent.
5. Nettoie l'état d'édition (`this.editingCharacterIds.delete(charId)`).
6. Sauvegarde et notifie : `this.saveState()`, `this.render()`, `this.showRollToast('Fiche modifiée', char.name, 'Enregistrée avec succès')`.

### 6.3. `saveAdventurerEdit(charId, card)` (Aventurier)
1. Récupère les inputs du formulaire :
   - `name`, `className`, `level` (1–10), `customTitle`, `alignment`, `race`, `knownLanguages`.
   - `xp`, `currentHp`, `maxHp`, `speed`, `baseSpeed`, `armorId`, `hasShield`, `weapon`.
   - Caractéristiques brutes (3–18) : `stat.mod = getModifier(stat.score)`.
   - Données de classe :
     - Si clerc : `classData.deity`, `daily.disapprovalRange`.
     - Si magicien/elfe : `classData.patron`, `classData.spells` (liste des sorts cochés).
     - Si guerrier/nain : `classData.luckyWeapon`.
   - Monnaies : `cp`, `sp`, `ep`, `gp`, `pp`.
   - `startingItem`, `notes`.
2. Recalculs DCC automatiques :
   - Sauvegardes de classe (via `getAdventurerSaves(char)`).
   - Recalcul de la CA (via armure + bouclier + agilité).
   - Normalisation : `normalizeAdventurer(char)`.
   - Mise à jour du statut `syncLegacyStatus(char)`.
3. Supprime `_isNew`.
4. Nettoie `editingCharacterIds` et `characterSnapshots`.
5. `this.saveState()`, `this.render()`, notification toast.

---

## 7. Rendu des Formulaires d'Édition

### 7.1. Structure du Formulaire Niveau 0 (`renderCharacterCardEdit`)
* **En-tête :** Champ de saisie du Nom, badge `Mode Édition`, boutons `💾 Terminer` et `❌ Annuler`.
* **Bloc Identité :**
  * Race (select : Humain, Elfe, Nain, Halfelin).
  * Métier (input texte).
  * Alignement (select : Loyal, Neutre, Chaotique).
  * Langues (input texte).
* **Bloc Vitales & Stats :**
  * PV actuels / PV max, Vitesse.
  * Grille des 6 Caractéristiques (inputs numériques 3–18).
  * Chance actuelle et initiale.
  * Signe porte-bonheur (select des 30 augures).
* **Bloc Équipement & Bourse :**
  * Armure (select) & Bouclier (checkbox).
  * Arme (select parmi `RULE_WEAPONS`).
  * Monnaie PC (input numérique).
  * Équipement (textarea) et Notes (textarea).

### 7.2. Structure du Formulaire Aventurier (`renderAdventurerCardEdit`)
* **En-tête :** Saisie du Nom, badge `Mode Édition`, boutons `💾 Terminer` et `❌ Annuler`.
* **Bloc Identité & Classe :**
  * Classe (select parmi les 7 classes DCC).
  * Niveau (select 1 à 10).
  * Alignement (select : Loyal, Neutre, Chaotique).
  * Race (select : Humain, Nain, Elfe, Halfelin).
  * Titre libre (input texte).
  * Langues (input texte).
* **Bloc Vitales & PX :**
  * PV actuels / PV max.
  * PX actuels (input numérique).
  * Vitesse.
* **Bloc Caractéristiques :**
  * 6 Caractéristiques brutes (inputs 3–18).
  * Chance actuelle et Chance initiale.
  * Signe porte-bonheur (select des 30 augures).
* **Bloc Combat & Protection :**
  * Armure (select) & Bouclier (checkbox).
  * Arme principale (select parmi `RULE_WEAPONS`).
* **Bloc Spécifique de Classe :**
  * Si Clerc : sélecteur de Divinité, valeur de désapprobation.
  * Si Magicien/Elfe : sélecteur de Patron, grille de cases à cocher des sorts connus (`WIZARD_SPELLS`).
  * Si Guerrier/Nain : arme chanceuse.
* **Bloc Inventaire & Bourse :**
  * PC, PA, PE, PO, PP (inputs numériques).
  * Équipement & Marchandise (textarea).
  * Notes / faits d'armes (textarea).

---

## 8. Stratégie de Tests Automatisés

Un nouveau fichier de test `tests/character_edit.test.mjs` sera créé (ou intégré dans `tests/adventurers.test.mjs`) pour valider :
1. **Création d'aventurier vierge :**
   * Vérification que `createBlankAdventurer()` retourne un objet valide passant `normalizeAdventurer()` et `validateCharacterData()`.
   * Vérification des valeurs par défaut (Niveau 1, Guerrier, 10 partout, 10 PV, 10 PX).
2. **Cohérence des recalculs après édition :**
   * Modification d'un score de Force de 10 à 18 -> le modificateur passe bien à +3.
   * Changement de classe d'un aventurier vers Clerc niveau 3 -> les sauvegardes Vigueur/Volonté sont recalculées conformément aux tables de Clerc niveau 3.
   * Ajout de sorts de magicien -> les sorts sont reconnus et utilisables.
3. **Cas limites :**
   * Saisie de PV à 0 -> statut passe à 'mort' ou 'agonisant' conformément à `getStatusCode`.
   * Restauration de PV positifs sur un agonisant -> le personnage revient à la vie.

---

## 9. Validation du Document

Ce document conclut la **Phase 3**.  
Une fois cette spécification validée par l'utilisateur, l'exécution du code pourra être démarrée.
