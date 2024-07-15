document.addEventListener("DOMContentLoaded", function () {
  const app = {
    widgetsLoaded: false,
    lang: "ru",
    translations: {},

    loadTranslations: function (callback) {
      fetch(`i18n/${this.lang}.json`)
        .then((response) => response.json())
        .then((data) => {
          this.translations = data;
          callback();
        });
    },

    t: function (key) {
      return this.translations[key] || key;
    },

    render: function () {
      if (this.widgetsLoaded) return true;

      this.widgetsLoaded = true;
      this.initWidget();

      return true;
    },

    initWidget: function () {
      const self = this;

      const buttonHtml = `<button id="get-package-code" class="button-input">${self.t(
        "get_package_code"
      )}</button>`;
      document.body.insertAdjacentHTML("beforeend", buttonHtml);

      document
        .getElementById("get-package-code")
        .addEventListener("click", function () {
          self.showModal();
        });
    },

    showModal: function () {
      const self = this;

      fetch("index.html")
        .then((response) => response.text())
        .then((modalHtml) => {
          document.body.insertAdjacentHTML("beforeend", modalHtml);

          const modal = document.getElementById("package-modal");
          const span = modal.querySelector(".close");

          modal.style.display = "block";
          span.addEventListener("click", function () {
            modal.style.display = "none";
            modal.remove();
          });

          document.querySelector(".modal-content h2").innerText =
            self.t("product_name");
          document.getElementById("search-product").innerText = self.t("find");

          document
            .getElementById("search-product")
            .addEventListener("click", function () {
              const productName = document.getElementById("product-name").value;
              if (productName) {
                self.searchProduct(productName, function (result) {
                  modal.style.display = "none";
                  modal.remove();
                });
              }
            });
        });
    },

    searchProduct: function (productName, callback) {
      const self = this;
      const apiUrl = `https://tasnif.soliq.uz/api/cls-api/mxik/search-subposition?search_text=${productName}&page=0&size=15&lang=ru`;

      fetch(apiUrl)
        .then((response) => response.json())
        .then((data) => {
          if (data && data.content && data.content.length > 0) {
            const productNames = data.content.map((item) => item.name);
            console.log("Названия товаров:", productNames);

            const mxikCode = data.content[0].mxikCode;
            self.getPackageCode(mxikCode, callback);
          } else {
            alert(self.t("product_not_found"));
            callback(null);
          }
        });
    },

    getPackageCode: function (mxikCode, callback) {
      const self = this;
      const apiUrl = `https://tasnif.soliq.uz/api/cls-api/mxik/get/by-mxik?mxikCode=${mxikCode}&lang=ru`;

      fetch(apiUrl)
        .then((response) => response.json())
        .then((data) => {
          if (data && data.packages && data.packages.length > 0) {
            const packageCode = data.packages[0].code;
            self.addNoteToDeal(mxikCode, packageCode);
            callback({ mxikCode, packageCode });
          } else {
            alert(self.t("package_not_found"));
            callback(null);
          }
        });
    },

    addNoteToDeal: function (mxikCode, packageCode) {
      const dealId = AMOCRM.data.current_card.id;
      const note = `ИКПУ: ${mxikCode}\nКод упаковки: ${packageCode}`;
      const data = {
        entity_id: dealId,
        note_type: "common",
        text: note,
      };

      fetch("/api/v2/notes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })
        .then((response) => response.json())
        .then((data) => {
          if (data) {
            alert(self.t("note_added"));
          }
        });
    },
  };

  app.loadTranslations(function () {
    app.render();
  });
});
