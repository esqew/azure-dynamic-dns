const Provider = require('./Provider');

module.exports = class ProviderArray extends Array {
    #picks;
        
    constructor(...args) {
        super(...args);
        this.resetPicks();
    }

    static fromProvidersArray = providersArray => new this(...providersArray.map(obj => new Provider(obj)));

    push(...args) {
        super.push(...args);
        this.resetPicks();
        return;
    }

    resetPicks() {
        this.#picks = Array(this.length).fill().map((cv, idx) => idx);
        return;
    }

    getRandomProvider() {
        if (this.#picks.length == 0) this.resetPicks();
        const selection = Math.floor(Math.random() * this.#picks.length);
        const randomProvider = this[this.#picks[selection]];
        this.#picks.splice(selection, 1);
        return randomProvider;
    }
}