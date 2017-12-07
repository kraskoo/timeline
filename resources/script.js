(function () {
	const monthRegex1 = /^\d{1,2} [a-zA-ZА-Яа-я]+$/;
	const monthRegex2 = /^\d{1,2} - \d{1,2} [a-zA-ZА-Яа-я]+$/;
	const monthRegex3 = /^\d{1,2} [a-zA-ZА-Яа-я]+? - \d{1,2} [a-zA-ZА-Яа-я]+$/;
	const oneDay = 24 * 60 * 60 * 1000;
	const months = [ "january", "february", "march", "april", "may", "june", "july", "august", "september", "octomber", "november", "december" ];
	const bgMonths = [ "януари", "февруари", "март", "април", "май", "юни", "юли", "август", "септември", "октомври", "ноември", "декември" ];
	let years = {};
	let currentDivider = 0;
	let eventsOrder = [];
	let positionByTitle = {};
	let categoryByTitle = {};
	let textByTitle = {};
	let originTitles = {};
	let data = null;
	let lowBound = 0;
	let highBound = 0;
	let halfScrnWidth = 0;
	let lang = "";
	
	function translateMonth(month) {
		switch(month) {
			case bgMonths[0]: return months[0];
			case bgMonths[1]: return months[1];
			case bgMonths[2]: return months[2];
			case bgMonths[3]: return months[3];
			case bgMonths[4]: return months[4];
			case bgMonths[5]: return months[5];
			case bgMonths[6]: return months[6];
			case bgMonths[7]: return months[7];
			case bgMonths[8]: return months[8];
			case bgMonths[9]: return months[9];
			case bgMonths[10]: return months[10];
			case bgMonths[11]: return months[11];
			default: return month;
		}
	};
	
	function getMonthAsNumber(month) {
		month = translateMonth(month);
		switch (month) {
			case months[0]: return 1;
			case months[1]: return 2;
			case months[2]: return 3;
			case months[3]: return 4;
			case months[4]: return 5;
			case months[5]: return 6;
			case months[6]: return 7;
			case months[7]: return 8;
			case months[8]: return 9;
			case months[9]: return 10;
			case months[10]: return 11;
			case months[11]: return 12;
		}
	};
	
	function getDaysOfYear(year) {
		let firstDate = new Date(year, 1, 0);
		let secondDate = new Date(year, 12, 31);
		return Math.round(Math.abs((firstDate.getTime() - secondDate.getTime()) / oneDay));
	};
	
	function getDaysOfMonth(year, month) {
		let monthStart = new Date(year, month, 1);
		let monthEnd = new Date(year, month + 1, 1);
		return Math.round((monthEnd - monthStart) / (oneDay));
	};
	
	function getTitle (day, month, year) {
		return ((("" + day).length === 1 ? ("0" + day) : day) + "." + (("" + month).length === 1 ? ("0" + month) : month) + "." + year);
	};
	
	function getDaysBeforeCurrentMonth (month, year) {
		month--;
		if (month === 0) {
			return 0;
		} else {
			let days = 0;
			for (let i = 0; i <= month - 1; i++) days += getDaysOfMonth(year, i);
			return days;
		}
	};
	
	function computePosition(daysOfYear, daysBeforeCurrentMonth, day, yearsLength) {
		return ((currentDivider / daysOfYear) * (daysBeforeCurrentMonth + day)) + (currentDivider * (yearsLength - 1));
	};
	
	function sortOrders() {
		eventsOrder = eventsOrder
			.sort(function (a, b) {
				let aMinusIndex = a.indexOf("-");
				let bMinusIndex = b.indexOf("-");
				let hasAIndex = aMinusIndex !== -1;
				let hasBIndex = bMinusIndex !== -1;
				let aParts = a.split(".");
				let bParts = b.split(".");
				let aYear = parseInt(aParts[2]);
				let aMonth = parseInt(aParts[1]);
				let aDay = parseInt(aParts[0]);
				let aCategory = categoryByTitle[a];
				if (hasAIndex) aDay += parseInt(a.substring(aMinusIndex));
				let aDays = getDaysBeforeCurrentMonth(aMonth, aYear) + aDay;
				let bYear = parseInt(bParts[2]);
				let bMonth = parseInt(bParts[1]);
				let bDay = parseInt(bParts[0]);
				let bCategory = categoryByTitle[b];
				if (hasBIndex) bDay += parseInt(b.substring(bMinusIndex));
				let bDays = getDaysBeforeCurrentMonth(bMonth, bYear) + bDay;
				if (aYear - bYear === 0) {
					return aDays - bDays;
				} else return aYear - bYear;
			});
	};
	
	function createYearMark (left, year) {
		let div = document.createElement("div");
		div.classList.add("year-mark");
		div.style.left = left + "px";
		div.innerHTML += year;
		return div;
	};
	
	function createMonthMark (left, month) {
		let div = document.createElement("div");
		div.classList.add("month-mark");
		div.style.left = left + "px";
		div.innerHTML += month;
		return div;
	};
	
	let monthByYear = [];
	function fillMaps (events) {
		let yearIndex = 1;
		let indices = Object.keys(events);
		for (let year in events) {
			if (events.hasOwnProperty(year)) {
				years[year] = [];
				let thisYear = parseInt(year);
				for (let monthNameIndex in bgMonths) {
					if (!monthByYear.includes(bgMonths[monthNameIndex] + "-" + thisYear)) {
						monthByYear.push(bgMonths[monthNameIndex] + "-" + thisYear);
						yearsLine().appendChild(createMonthMark((currentDivider * (yearIndex - 1)) + ((monthNameIndex) * (currentDivider / 12)), lang === "bg" ? bgMonths[monthNameIndex] : months[monthNameIndex]));
					}
				}
				
				yearsLine().appendChild(createYearMark(currentDivider * yearIndex++, year));
				for (let index in indices) {
					if (events[year].hasOwnProperty(index)) {
						let category = events[year][index];
						for (let categoryIndex in category) {
							let title = null;
							let origin = null;
							let day = 0;
							let daysBeforeCurrentMonth = 0;
							let match3 = categoryIndex.match(monthRegex3);
							let match2 = categoryIndex.match(monthRegex2);
							let match1 = categoryIndex.match(monthRegex1);
							if (match3 !== null) {
								let currentMatch = match3[0].split(" - ");
								let dayAndMonth = currentMatch[0].split(" ");
								let month = getMonthAsNumber(dayAndMonth[1]);
								day = parseInt(dayAndMonth[0]);
								title = origin = getTitle(day, month, thisYear);
								let dayAndMonth2 = currentMatch[1].split(" ");
								origin = title + " -<br />" + getTitle(parseInt(dayAndMonth2[0]), getMonthAsNumber(dayAndMonth2[1]), thisYear);
								daysBeforeCurrentMonth = getDaysBeforeCurrentMonth(month, thisYear);
							} else if (match2 !== null) {
								let match = match2[0];
								let dayAndRest = match.split(" - ");
								let month = getMonthAsNumber(dayAndRest[1].split(" ")[1]);
								day = parseInt(dayAndRest[0]);
								title = getTitle(day, month, thisYear);
								origin = title + " -<br />" + getTitle(parseInt(dayAndRest[1]), month, thisYear)
								daysBeforeCurrentMonth = getDaysBeforeCurrentMonth(month, thisYear);
							} else if (match1 !== null) {
								let dayAndMonth = match1[0].split(" ");
								let month = getMonthAsNumber(dayAndMonth[1]);
								day = parseInt(dayAndMonth[0]);
								title = origin = getTitle(day, month, thisYear);
								daysBeforeCurrentMonth = getDaysBeforeCurrentMonth(month, thisYear);
							}
							
							let yearsLength = Object.keys(years).length;
							if (category[categoryIndex] instanceof Array) {
								let array = category[categoryIndex];
								for (let i = 0; i < array.length; i++) {
									let currentTitle = title + "-" + i;
									eventsOrder.push(currentTitle);
									positionByTitle[currentTitle] = computePosition(getDaysOfYear(thisYear), daysBeforeCurrentMonth, day, yearsLength);
									categoryByTitle[currentTitle] = parseInt(index);
									textByTitle[currentTitle] = array[i];
									originTitles[currentTitle] = origin;
								}
							} else {
								if (eventsOrder.includes(title)) {
									let newTitle = "";
									for (let i = 1; i < 10; i++) {
										let currentNew = title + "-" + i;
										if (!eventsOrder.includes(currentNew)) {
											newTitle = currentNew;
											break;
										}
									}
									
									title = newTitle;
								}
								
								eventsOrder.push(title);
								positionByTitle[title] = computePosition(getDaysOfYear(thisYear), daysBeforeCurrentMonth, day, yearsLength);
								categoryByTitle[title] = parseInt(index);
								textByTitle[title] = category[categoryIndex];
								originTitles[title] = origin;
							}
						}
					}
				}
			}
		}
	};
	
	function createEventDiv(key, left, top, zIndex) {
		let div = document.createElement("div");
		div.classList.add("box");
		div.classList.add("open");
		div.style.top = top + "px";
		div.style.left = left + "px";
		div.style.zIndex = zIndex;
		div.setAttribute("z-index", zIndex);
		div.setAttribute("id", "e" + zIndex);
		div.setAttribute("key", key);
		div.innerHTML = originTitles[key];
		return div;
	};
	
	function openBox (div) {
		div.classList.replace("open", "close");
	};
	
	function closeBox (div) {
		div.classList.replace("close", "open");
	};
	
	function getBackDefaultDivZIndex (div) {
		div.style.zIndex = div.getAttribute("z-index");
	};
	
	function setHighestDivZIndex (div) {
		div.style.zIndex = highestZIndex + 2;
	};
	
	function setActiveDivZIndex(div) {
		div.style.zIndex = highestZIndex + 1;
	};
	
	function removeTextInfo() {
		document.getElementById("top").removeChild(textContainer);
	};
	
	function appendTextInfo() {
		textContainer = document.createElement("div");
		let paragraph = document.createElement("p");
		let key = activeDiv.getAttribute("key");
		let color = data.config.colors[data.defitions[categoryByTitle[key]].color];
		paragraph.innerHTML += textByTitle[key];
		textContainer.appendChild(paragraph);
		let top = document.getElementById("top");
		top.appendChild(textContainer);
		$(top).animate({ backgroundColor: color }, 300);
		$("#bottom").animate({ backgroundColor: color }, 300);
	};
	
	function createDotMark(left, key) {
		let div = document.createElement("div");
		div.title = originTitles[key].replace("<br />", " ");
		div.classList.add("day-mark");
		div.style.left = left + "px";
		return div;
	};
	
	let heights = [];
	let indexHeight = 0;
	let highestZIndex = 0;
	let boxes = [];
	function putEventsOnLine() {
		let zIndex = 5;
		innerLine().style.left = 0;
		for (let prop in eventsOrder) {
			if (eventsOrder.hasOwnProperty(prop)) {
				let currentKey = eventsOrder[prop];
				let currentLeft = positionByTitle[currentKey];
				let currentTop = heights[indexHeight];
				indexHeight = (indexHeight + 1) % heights.length;
				let newDiv = createEventDiv(currentKey, currentLeft, currentTop, zIndex++);
				innerLine().appendChild(newDiv);
				yearsLine().appendChild(createDotMark(currentLeft, currentKey));
				setListeners(newDiv);
				boxes.push(newDiv);
			}
		}
		
		highestZIndex = zIndex;
	};
	
	function isInRange(next) {
		return (parseFloat(boxes[0].style.left) - halfScrnWidth) * -1 >= next && (parseFloat(boxes[boxes.length - 1].style.left) - halfScrnWidth) * -1 <= next;
	};
	
	let isMouseDownOnBottom = false;
	let isUsedByAnimation = false;
	let canMove = false;
	let startPosition = 0;
	let clientXOnStart = 0;
	let startTime = 0;
	let endTime = 0;
	let innerLine = (function () {
		return document.getElementById("inner-line");
	});
	let yearsLine = (function () {
		return document.getElementById("years-line")
	});	
	function initializeMovement () {
		let bottom = document.getElementById("bottom");
		bottom.addEventListener("mousedown", function (evnt) {
			isMouseDownOnBottom = true;
			startTime = new Date().getTime();
			startPosition = parseFloat(innerLine().style.left);
			clientXOnStart = evnt.clientX - startPosition;
		}, true);
		bottom.addEventListener("mousemove", function (evnt) {
			let newPosition = evnt.clientX - clientXOnStart;
			if (isInRange(newPosition) && isMouseDownOnBottom) {
				canMove = true;
				yearsLine().style.left = newPosition + "px";
				innerLine().style.left = newPosition + "px";
			}
		}, true);
		bottom.addEventListener("mouseup", function (evnt) {
			isMouseDownOnBottom = false;
			if (!isUsedByAnimation) canMove = false;
			endTime = new Date().getTime();
		}, true);
		bottom.addEventListener("mouseleave", function (evnt) {
			if (!$(evnt.target).hasClass("box") && evnt.target !== $("#middle-line")[0] && evnt.target !== $("#years-line")[0] && evnt.target !== innerLine()) {
				isMouseDownOnBottom = false;
				startTime = endTime = 0;
				if (!isUsedByAnimation) canMove = false;
			}
		}, true);
	};
	
	function stopAnimation() {
		$(innerLine()).stop();
		canMove = !canMove;
		isUsedByAnimation = !isUsedByAnimation;
	};
	
	function setHighBound() {
		highBound = (Object.keys(data.events).length * currentDivider) + currentDivider;
	};
	
	function setLineWidths(size) {
		innerLine().style.width = yearsLine().style.width = highBound + "px";
	};
	
	function setHeights() {
		heights = data.config.divHeights;
		if (window.screen.height >= 1080) {
			for (let i = 1, incrementor = 15; i < heights.length; i++, incrementor *= 2) {
          heights[i] += incrementor;
      }
		}
	};
	
	function config () {
		currentDivider = parseInt(data.config.yearDivider);
		setHeights();
		halfScrnWidth = window.screen.width / 2;
		setHighBound();
		setLineWidths(halfScrnWidth);
	};
	
	let indexOfActiveDiv = 0;
	let activeDiv = null;
	let textContainer = null;
	function setListeners(div) {
		div.addEventListener("mouseover", function() {
			setHighestDivZIndex(div);
			openBox(div);
		}, true);
		div.addEventListener("mouseout", function() {
			if (activeDiv !== div) {
				getBackDefaultDivZIndex(div);
				closeBox(div);
			}
		}, true);
		div.addEventListener("click", function() {
			if (endTime - startTime <= 180) {
				indexOfActiveDiv = boxes.indexOf(div);
				activateDiv(div);
				startTime = endTime = 0;
			}
		}, true);
	};
	
	function activateDiv(div) {
		if (!canMove) {
			isUsedByAnimation = !isUsedByAnimation;
			canMove = !canMove;
			if (activeDiv !== null) {
				getBackDefaultDivZIndex(activeDiv);
				closeBox(activeDiv);
				removeTextInfo();
			}

			activeDiv = div;
			setActiveDivZIndex(activeDiv);
			openBox(activeDiv);
			appendTextInfo();
			let leftPosition = (parseFloat(div.style.left) - halfScrnWidth) * -1;
			$(yearsLine()).animate({ left: (leftPosition - 2) + "px" }, 300);
			$(innerLine()).animate({ left: (leftPosition - 2) + "px" }, 300, function () {
				canMove = !canMove;
				isUsedByAnimation = !isUsedByAnimation;
			});
		}
	};
	
	function goToNextBox() {
		indexOfActiveDiv = (indexOfActiveDiv + 1) % boxes.length;
		activateDiv(boxes[indexOfActiveDiv]);
	};
	
	function goToPreviousBox() {
		indexOfActiveDiv = (boxes.length + (indexOfActiveDiv - 1)) % boxes.length;
		activateDiv(boxes[indexOfActiveDiv]);
	};
	
	function initializeArrows() {
		document.addEventListener("keydown", function (evnt) {
			if (evnt.keyCode === 37) goToPreviousBox();
			else if (evnt.keyCode === 39) goToNextBox();
		}, true);
		document.getElementById("left-arrow").addEventListener("click", goToPreviousBox, true);
		document.getElementById("right-arrow").addEventListener("click", goToNextBox, true);
	};
	
	function goToFirst() {
		activateDiv(boxes[0]);
	};
	
	function onLoadedData (response) {
		data = response;
		config();
		fillMaps(data.events);
		sortOrders();
		putEventsOnLine();
		initializeArrows();
		initializeMovement();
		goToFirst();
		setLangButtonText();
		addLangButtonListener();
	};
	
	function addLangButtonListener() {
		document.getElementById("lang").addEventListener("click", function () {
			sessionStorage.setItem("lang", setLangTextBySession().toLowerCase());
			window.location.reload();
		}, true);
	}
	
	function setLangButtonText() {
		document.getElementById("lang").innerHTML += setLangTextBySession();
	};
	
	function setupSessionLang() {
		if (sessionStorage.getItem("lang") === null) {
			sessionStorage.clear();
			sessionStorage.setItem("lang", "bg");
		}
		
		lang = sessionStorage.getItem("lang");
	};
	
	function getFilenameByLang() {
		switch (lang) {
			case "bg": return "resources/data.json";
			case "en": return "resources/data-en.json";
			default: return "";
		}
	};
	
	function setLangTextBySession() {
		switch (lang) {
			case "bg": return "EN";
			case "en": return "BG";
			default: return "";
		}
	};
	
	(function () {
		setupSessionLang();
		const url = getFilenameByLang();
		$.ajax({
			dataType: "json",
			contentType: "application/json",
			url: url
		}).done(onLoadedData);
	}());
	
	this.oncontextmenu = function () {
		return false;
	};

	this.ondragstart = function () {
		return false;
	};
}());