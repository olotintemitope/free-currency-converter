class CurrencyConverter {
  constructor() {
    this.registerWorker();
    this.dbPromise = this.openDb();
    this.fetchCurrency();
    this.loadCurrenciesToSelectDropDown();
    this.handleConversion();
  }

  fetchCurrency() {
    fetch('https://free.currencyconverterapi.com/api/v5/currencies')
      .then((response) => response.json())
      .then((myJson) => {
        let currencies = Object.values(myJson.results);
        this.save(currencies);
      }).catch(error => console.log(error));
  }

  openDb() {
    let dbPromise = idb.open('currency-db', 1, (upgradeDb) => {
      let currency = upgradeDb.createObjectStore('currencies', {
        keyPath: 'id'
      });
      currency.createIndex('id', 'id');
    });

    return dbPromise;
  }

  registerWorker() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () =>
        navigator.serviceWorker.register('./serviceWorker.js')
      );
    }

    window.addEventListener('online', function () {
      document.querySelector('.connectivity-status').innerText = 'online';
    })

    window.addEventListener('offline', function () {
      document.querySelector('.connectivity-status').innerText = 'offline';
    });
  }

  save(currencies) {
    this.dbPromise.then((db) => {
      if (!db) return;

      let tx = db.transaction('currencies', 'readwrite');
      let store = tx.objectStore('currencies');

      for (let currency of currencies) {
        store.put(currency);
      }
      // limit store to 1600 items
      store.index('id').openCursor(null, "prev").then(cursor => {
        return cursor.advance(160);
      }).then(function deleteRest(cursor) {
        if (!cursor) return;
        cursor.delete();
        return cursor.continue().then(deleteRest);
      });
    });
  }

  getAllCurrencies() {
    return new Promise((resolve, reject) => {
        this.dbPromise.then((db) => {
          if (!db) return;
          
          let tx = db.transaction('currencies')
            .objectStore('currencies')
            .index('id');
            tx.getAll().then(currencies => {
            resolve(currencies);
          });
        });
      }
    );
  }

  loadCurrenciesToSelectDropDown() {
    let fromCountry = document.querySelector('#country1');
    let toCountry = document.querySelector('#country2');

    this.getAllCurrencies().then(currencies => {
      currencies.forEach(currency => {
        let option = document.createElement("option");
        option.value= currency.id;
        option.innerHTML = currency.currencyName;

        let option2 = document.createElement("option");
        option2.value= currency.id;
        option2.innerHTML = currency.currencyName;

        // then append it to the select element
        fromCountry.appendChild(option);
        toCountry.appendChild(option2);
      });
    });
  }

  handleConversion() {
    document.querySelector('#convert-now')
      .addEventListener('click', (event) => {
        let country1 = document.querySelector('#country1').value;
        let country2 = document.querySelector('#country2').value;
        let amount = document.querySelector('#amount').value;

        let fromCurrency = encodeURIComponent(country1);
        let toCurrency = encodeURIComponent(country2);
        let query = fromCurrency + '_' + toCurrency;

        if (country1 == 0 || country2 == 0 || amount == '' || amount < 0 ) {
          return;
        }
        // Get the exchange rate 
        this.getExchangeRate(query).then(result => {
          let convertedAmount = document.querySelector('#converted-amount');
          convertedAmount.value = parseInt((result[query] * amount));
        }).catch(error => {
          alert(error);
        });
    });
  }

  getExchangeRate(query) {
    return new Promise((resolve, reject) => {
      fetch(`https://free.currencyconverterapi.com/api/v5/convert?q=${query}&compact=ultra`)
      .then((response) => response.json())
      .then((result) => {
        resolve(result);
      }).catch(error => {
        reject(Error('The exchange rate has not been cachd. Try again when you\'re online'));
      });
    });
  }
}

(function () {
  var converter = new CurrencyConverter();
})();