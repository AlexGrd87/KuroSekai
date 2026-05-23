/**
 * ShopUI.js
 * Boutique — achat d'objets (EXP), de tirages supplémentaires et de boosts.
 */

import { gsap }  from 'gsap';
import { audio } from '../audio/AudioManager.js';

/* ── Catalogue ──────────────────────────────────────────────── */

const SHOP_CATALOG = [
  // Objets — potions EXP
  { id: 'exp_nano',    tab: 'items',  name: 'Nano·EXP',           kanji: '経',
    desc:  'Injecte +300 EXP directement dans un combattant.',
    price: 300,  maxBuy: 99, effect: { type: 'exp',     amount: 300  } },
  { id: 'exp_serum',   tab: 'items',  name: 'Sérum Synaptique',    kanji: '憶',
    desc:  'Injecte +800 EXP. Pour les unités en progression rapide.',
    price: 800,  maxBuy: 99, effect: { type: 'exp',     amount: 800  } },
  { id: 'exp_implant', tab: 'items',  name: 'Implant Neuronal',    kanji: '脳',
    desc:  'Injecte +2 000 EXP. Réservé aux unités d\'élite.',
    price: 1800, maxBuy: 99, effect: { type: 'exp',     amount: 2000 } },
  // Invocations
  { id: 'pull_1',      tab: 'summon', name: 'Fragment Unique',     kanji: '召',
    desc:  '+1 invocation gratuite, utilisable au Portail d\'invocation.',
    price: 600,  maxBuy: 99, effect: { type: 'pulls',   amount:  1   } },
  { id: 'pull_10',     tab: 'summon', name: 'Fragment ×10',        kanji: '喚',
    desc:  '+10 invocations groupées — garantie 4★ incluse.',
    price: 5000, maxBuy: 99, effect: { type: 'pulls',   amount: 10   } },
  // Boosts
  { id: 'xp_boost',   tab: 'boost',  name: 'Boost Neuronal ×2',   kanji: '速',
    desc:  'Double l\'EXP gagnée pendant les 5 prochains combats.',
    price: 1500, maxBuy: 3,  effect: { type: 'xpBoost', amount:  5   } },
];

export class ShopUI {
  constructor(playerData, onBack) {
    this.playerData   = playerData;
    this.onBack       = onBack;
    this.screen       = document.getElementById('shop-screen');
    this._activeTab   = 'items';
    this._pendingItem = null;

    this._bind();
  }

  /* ── Listeners ─────────────────────────────────────────── */

  _bind() {
    document.getElementById('shop-back-btn')
      ?.addEventListener('click', () => this._doBack());

    document.querySelectorAll('.shop-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        audio.play('ui_click');
        this._setTab(btn.dataset.tab);
      });
    });

    document.getElementById('scp-cancel')
      ?.addEventListener('click', () => this._closeCharPicker());
  }

  /* ── Show / Hide ─────────────────────────────────────── */

  show() {
    this._updateCurrency();
    this._setTab(this._activeTab, true);

    gsap.set(this.screen, { display: 'flex', opacity: 0 });
    gsap.to(this.screen,  { opacity: 1, duration: 0.35, ease: 'power2.out' });
    gsap.fromTo('#shop-header',
      { y: -20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.4, delay: 0.08, ease: 'power2.out' });
    gsap.fromTo('#shop-tabs',
      { y: -10, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.35, delay: 0.16, ease: 'power2.out' });
  }

  _doBack() {
    audio.play('ui_navigate');
    gsap.to(this.screen, {
      opacity: 0, duration: 0.3, ease: 'power2.in',
      onComplete: () => {
        gsap.set(this.screen, { display: 'none' });
        this.onBack?.();
      },
    });
  }

  /* ── Tabs ────────────────────────────────────────────── */

  _setTab(tab, silent = false) {
    this._activeTab = tab;
    document.querySelectorAll('.shop-tab-btn').forEach(b =>
      b.classList.toggle('shop-tab-btn--active', b.dataset.tab === tab)
    );
    this._renderGrid(tab, silent);
  }

  /* ── Grid ────────────────────────────────────────────── */

  _renderGrid(tab, silent = false) {
    const grid  = document.getElementById('shop-grid');
    const items = SHOP_CATALOG.filter(i => i.tab === tab);
    grid.innerHTML = '';

    items.forEach((item, idx) => {
      const canAfford = this.playerData.currency >= item.price;
      const card      = document.createElement('div');
      card.className  = `shop-item-card${canAfford ? '' : ' shop-item-card--locked'}`;
      card.dataset.id = item.id;

      let extraInfo = '';
      if (item.effect.type === 'xpBoost') {
        const rem = this.playerData.xpBoostCombats ?? 0;
        if (rem > 0) {
          extraInfo = `<span class="sic-active-badge">⚡ Actif : ${rem} combat${rem > 1 ? 's' : ''}</span>`;
        }
      }
      if (item.effect.type === 'pulls') {
        const fr = this.playerData.freeRolls ?? 0;
        if (fr > 0) {
          extraInfo = `<span class="sic-active-badge">🔮 Stock : ×${fr}</span>`;
        }
      }

      card.innerHTML = `
        <div class="sic-kanji">${item.kanji}</div>
        <div class="sic-body">
          <div class="sic-name">${item.name}</div>
          <div class="sic-desc">${item.desc}</div>
          ${extraInfo}
        </div>
        <div class="sic-footer">
          <div class="sic-price"><span class="sic-cur-icon">◈</span> ${item.price.toLocaleString()}</div>
          <button class="sic-buy-btn${canAfford ? '' : ' sic-buy-btn--disabled'}"
                  ${canAfford ? '' : 'disabled'}>
            ACHETER
          </button>
        </div>
      `;

      card.querySelector('.sic-buy-btn')?.addEventListener('click', () => {
        if (!canAfford) { this._shakeCard(card); return; }
        this._handleBuy(item, card);
      });

      grid.appendChild(card);
      if (!silent) {
        gsap.fromTo(card,
          { opacity: 0, y: 18 },
          { opacity: 1, y: 0, duration: 0.28, delay: idx * 0.07, ease: 'power2.out' }
        );
      }
    });
  }

  /* ── Purchase logic ──────────────────────────────────── */

  _handleBuy(item, cardEl) {
    audio.play('ui_click');
    if (item.effect.type === 'exp') {
      this._pendingItem = item;
      this._openCharPicker(item);
    } else {
      this._completePurchase(item, null, cardEl);
    }
  }

  _completePurchase(item, charId = null, cardEl = null) {
    if (!this.playerData.spendCurrency(item.price)) return;

    const fx = item.effect;
    let toastMsg = '';

    if (fx.type === 'exp' && charId) {
      this.playerData.addExp(charId, fx.amount);
      toastMsg = `✦ +${fx.amount.toLocaleString()} EXP appliqué à ${charId.toUpperCase()} !`;
    } else if (fx.type === 'pulls') {
      this.playerData.addFreeRolls(fx.amount);
      toastMsg = `🔮 ×${fx.amount} tirage${fx.amount > 1 ? 's' : ''} ajouté${fx.amount > 1 ? 's' : ''} au Portail`;
    } else if (fx.type === 'xpBoost') {
      this.playerData.addXpBoost(fx.amount);
      toastMsg = `⚡ Boost ×2 EXP activé — ${fx.amount} combats`;
    }

    // Animation sur la carte : flash de succès
    if (cardEl) {
      gsap.timeline()
        .to(cardEl, { scale: 1.04, borderColor: '#00e896', duration: 0.12, ease: 'power2.out' })
        .to(cardEl, { scale: 1,    borderColor: '',        duration: 0.25, ease: 'power2.in' });
    }

    this._updateCurrency();
    this._setTab(this._activeTab, true);
    this._showToast(toastMsg);
  }

  /* ── Character picker ────────────────────────────────── */

  _openCharPicker(item) {
    const picker   = document.getElementById('shop-char-picker');
    const box      = document.getElementById('scp-box');
    const charsEl  = document.getElementById('scp-chars');

    document.getElementById('scp-item-desc').textContent = item.desc;
    charsEl.innerHTML = '';

    const charIds = Object.keys(this.playerData.collection);
    if (charIds.length === 0) {
      charsEl.innerHTML = '<p class="scp-empty">Aucun combattant dans la collection.</p>';
    } else {
      charIds.forEach(id => {
        const prog  = this.playerData.expProgress(id);
        const maxed = prog.maxed;
        const btn   = document.createElement('button');
        btn.className = `scp-char-btn${maxed ? ' scp-char-btn--maxed' : ''}`;
        btn.disabled  = maxed;

        const pct = Math.round(prog.pct);
        btn.innerHTML = `
          <span class="scp-char-name">${id.toUpperCase()}</span>
          <span class="scp-char-lv">Lv.${prog.level}</span>
          <div class="scp-char-bar-wrap">
            <div class="scp-char-bar" style="width:${pct}%"></div>
          </div>
          ${maxed ? '<span class="scp-char-max">MAX</span>' : ''}
        `;
        btn.addEventListener('click', () => {
          audio.play('ui_click');
          this._closeCharPicker();
          this._completePurchase(item, id);
        });
        charsEl.appendChild(btn);
      });
    }

    gsap.set(picker, { display: 'flex', opacity: 0 });
    gsap.set(box,    { scale: 0.82, y: 24, opacity: 0 });
    gsap.to(picker,  { opacity: 1, duration: 0.2 });
    gsap.to(box,     { scale: 1, y: 0, opacity: 1, duration: 0.32, ease: 'back.out(1.8)' });
  }

  _closeCharPicker() {
    const picker = document.getElementById('shop-char-picker');
    const box    = document.getElementById('scp-box');
    gsap.to(box, {
      scale: 0.88, opacity: 0, y: 12, duration: 0.2, ease: 'power2.in',
      onComplete: () => gsap.set(picker, { display: 'none' }),
    });
    this._pendingItem = null;
  }

  /* ── Helpers ─────────────────────────────────────────── */

  _updateCurrency() {
    const el = document.getElementById('shop-currency-val');
    if (el) el.textContent = (this.playerData.currency ?? 0).toLocaleString();
  }

  _shakeCard(card) {
    gsap.timeline()
      .to(card, { x: -9, duration: 0.04 })
      .to(card, { x:  8, duration: 0.04 })
      .to(card, { x: -5, duration: 0.04 })
      .to(card, { x:  0, duration: 0.05 });
  }

  _showToast(msg) {
    const toast = document.getElementById('shop-toast');
    if (!toast) return;
    toast.textContent = msg;
    gsap.killTweensOf(toast);
    gsap.fromTo(toast,
      { opacity: 0, y: 12 },
      {
        opacity: 1, y: 0, duration: 0.25, ease: 'power2.out',
        onComplete: () => {
          gsap.to(toast, { opacity: 0, y: -10, duration: 0.3, delay: 2.0 });
        },
      }
    );
  }
}
