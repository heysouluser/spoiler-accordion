/* 
Для родителя спойлеров пишем атрибут data-spollers 
Для заголовков спойлеров пишем атрибут data-spoller
Если нужно включать\выключать работу спойлеров на разных размерах экранов
пишем параметры ширины и типа брейкпоинта.
Например:
data-spollers="992, max" - спойлеры будут работать только на экранах меньше или равно 992рх 
data-spollers="768, min" - спойлеры будут работать только на экранах больше или равно 768px

Если нужно чтобы в блоке открывался болько один спойлер добавляем атрибут data-one-spoller 
*/

const spollersArray = document.querySelectorAll('[data-spollers]');
if (spollersArray.length > 0) {
   // получение обычных спойлеров
   // переводим коллекцию в массив (Array.from) и делаем проверку на отсутствие данных в дата-атрибуте spollers
   const spollersRegular = Array.from(spollersArray).filter(function (item, index, self) {
      return !item.dataset.spollers.split(",")[0];
   });
   // инициализация обычных спойлеров
   if (spollersRegular.length > 0) {
      initSpollers(spollersRegular);
   }

   // получение спойлеров с медиа запросами
   const spollersMedia = Array.from(spollersArray).filter(function (item, index, self) {
      return item.dataset.spollers.split(",")[0];
   });

   // инициализация спойлеров с медиа запросами
   if (spollersMedia.length > 0) {
      const breakpointsArray = [];
      spollersMedia.forEach(item => {
         const params = item.dataset.spollers;
         const breakpoint = {};
         const paramsArray = params.split(",");
         breakpoint.value = paramsArray[0];
         breakpoint.type = paramsArray[1] ? paramsArray[1].trim() : "max";
         breakpoint.item = item;
         breakpointsArray.push(breakpoint);
      });

      // Получаем уникальные брейкпойнты
      let mediaQueries = breakpointsArray.map(function (item) {
         return '(' + item.type + "-width: " + item.value + "px)," + item.value + ',' + item.type;
      });
      // Возвращаем уникальные значения медиазапросов без повторов (для той ситуации если вдруг будут одинаковые значения медиазапросов на разных блоках со спойлерами)
      mediaQueries = mediaQueries.filter(function (item, index, self) {
         return self.indexOf(item) === index;
      });

      // Работаем с каждым брейкпойнтом
      mediaQueries.forEach(breakpoint => {
         const paramsArray = breakpoint.split(",");
         const mediaBreakpoint = paramsArray[1];
         const mediaType = paramsArray[2];
         // метод, который будет "слушать" ширину экрана и отрабатывать, если сработал тот или иной брейкпоинт
         const matchMedia = window.matchMedia(paramsArray[0]); // paramsArray[0] - значение в скобках из mediaQueries

         // Объекты с нужными условиями
         const spollersArray = breakpointsArray.filter(function (item) {
            if (item.value === mediaBreakpoint && item.type === mediaType) {
               return true;
            }
         });
         // Событие
         // см. что будет с addEventListener
         matchMedia.addListener(function () {
            initSpollers(spollersArray, matchMedia);
         });
         initSpollers(spollersArray, matchMedia);
      });
   }

   // Инициализация
   function initSpollers(spollersArray, matchMedia = false) {
      spollersArray.forEach(spollersBlock => {
         // из-за разницы между типами спойлеров (обычные и с медиа-запросами) устанавливаем проверку
         // если true, то присваиваем имя объекта (см. инициализация спойлеров с медиа запросами - breakpoint.item = item;)
         spollersBlock = matchMedia ? spollersBlock.item : spollersBlock;
         // matchMedia.matches - это значит, что наш брейкпоинт сработал, т.е. если для спойлера с dataset.spollers = "650,min" это min-width: 650px, то вернется true если размер экрана больше либо равен 650px
         if (matchMedia.matches || !matchMedia) {
            // по классу _init выводим всю атрибутику спойлера (см. css с этим классом)
            spollersBlock.classList.add('_init');
            // работаем с контентной частью спойлера
            initSpollerBody(spollersBlock);
            spollersBlock.addEventListener("click", setSpollerAction);
         } else {
            spollersBlock.classList.remove('_init');
            initSpollerBody(spollersBlock, false);
            spollersBlock.removeEventListener("click", setSpollerAction);
         }
      });
   }

   // Работа с контентом
   function initSpollerBody(spollersBlock, hideSpollerBody = true) {
      const spollerTitles = spollersBlock.querySelectorAll('[data-spoller]');
      if (spollerTitles.length > 0) {
         spollerTitles.forEach(spollerTitle => {
            if (hideSpollerBody) {
               // включает возможность перехода по данным заголовкам по клику на tab
               spollerTitle.removeAttribute('tabindex');
               // если у заголовка нет класса _active, скрываем контентную часть
               if (!spollerTitle.classList.contains('_active')) {
                  spollerTitle.nextElementSibling.hidden = true; // аналог display:none, но более изящный (нюансы по доступности)
               }
            } else {
               // если передается false (см. ф-ю initSpollers в конце - когда не срабатывает брейкпоинт), тогда наоборот добавляем атрибут tabindex со значением -1 (в таком случае спойлер отображается в виде обычного блока)
               spollerTitle.setAttribute('tabindex', '-1');
               spollerTitle.nextElementSibling.hidden = false;
            }
         });
      }
   }
   // Выполняется, когда кликаем на заголовок (кнопку) спойлера (см. initSpollers)
   function setSpollerAction(e) {
      const el = e.target;
      // el.closest('[data-spoller]') на тот случай, если, например, внутри кнопки контент будет заключен в span
      if (el.hasAttribute('data-spoller') || el.closest('[data-spoller]')) {
         const spollerTitle = el.hasAttribute('data-spoller') ? el : el.closest('[data-spoller]');
         const spollersBlock = spollerTitle.closest('[data-spollers]');
         const oneSpoller = spollersBlock.hasAttribute('data-one-spoller') ? true : false;
         // проверяем, есть ли у родителя в данный момент объекты с классом _slide (если нет, то работаем далее)
         if (!spollersBlock.querySelectorAll('._slide').length) {
            // проверка на то, нужно ли нам добавлять функционал аккордеона или нет 
            // если oneSpoller === true и у нажатой кнопки нет класса _active, тогда скрываем остальные спойлеры
            if (oneSpoller && !spollerTitle.classList.contains('_active')) {
               hideSpollersBody(spollersBlock);
            }
            spollerTitle.classList.toggle('_active');
            _slideToggle(spollerTitle.nextElementSibling, 500);
         }
         e.preventDefault();
      }
   }
   function hideSpollersBody(spollersBlock) {
      // активный открытый спойлер внутри родительского объекта
      const spollerActiveTitle = spollersBlock.querySelector('[data-spoller]._active');
      // если такой спойлер есть, то удаляем у него класс _active и скрываем все элементы при помощи _slideUp
      if (spollerActiveTitle) {
         spollerActiveTitle.classList.remove('_active');
         _slideUp(spollerActiveTitle.nextElementSibling, 500);
      }
   }
}

//======================================================================
// SlideToggle

// анимированно скрывает объект
let _slideUp = (target, duration = 500) => {
   // Важная проверка!!!
   if (!target.classList.contains('_slide')) {
      target.classList.add('_slide');
      target.style.transitionProperty = 'height, margin, padding';
      target.style.transitionDuration = duration + 'ms';
      target.style.height = target.offsetHeight + 'px';
      target.offsetHeight;
      target.style.overflow = 'hidden';
      target.style.height = 0;
      target.style.paddingTop = 0;
      target.style.paddingBottom = 0;
      target.style.marginTop = 0;
      target.style.marginBottom = 0;
      window.setTimeout(() => {
         target.hidden = true;
         target.style.removeProperty('height');
         target.style.removeProperty('padding-top');
         target.style.removeProperty('padding-bottom');
         target.style.removeProperty('margin-top');
         target.style.removeProperty('margin-bottom');
         target.style.removeProperty('overflow');
         target.style.removeProperty('transition-duration');
         target.style.removeProperty('transition-property');
         target.classList.remove('_slide');
      }, duration);
   }
}

// анимированно показывает объект
let _slideDown = (target, duration = 500) => {
   // Важная проверка!!!
   if (!target.classList.contains('_slide')) {
      target.classList.add('_slide');
      if (target.hidden) {
         target.hidden = false;
      }
      let height = target.offsetHeight;
      target.style.overflow = 'hidden';
      target.style.height = 0;
      target.style.paddingTop = 0;
      target.style.paddingBottom = 0;
      target.style.marginTop = 0;
      target.style.marginBottom = 0;
      target.offsetHeight;
      target.style.transitionProperty = 'height, margin, padding';
      target.style.transitionDuration = duration + 'ms';
      target.style.height = height + 'px';
      target.style.removeProperty('padding-top');
      target.style.removeProperty('padding-bottom');
      target.style.removeProperty('margin-top');
      target.style.removeProperty('margin-bottom');
      window.setTimeout(() => {
         target.style.removeProperty('height');
         target.style.removeProperty('overflow');
         target.style.removeProperty('transition-duration');
         target.style.removeProperty('transition-property');
         target.classList.remove('_slide');
      }, duration);
   }
}

let _slideToggle = (target, duration = 500) => {
   if (target.hidden) {
      return _slideDown(target, duration);
   } else {
      return _slideUp(target, duration);
   }
}