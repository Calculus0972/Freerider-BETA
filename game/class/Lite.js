import StrongMap from "../../shared/ShallowMap.js";

window.lite = new class {
    loaded = false;
    storage = new StrongMap(JSON.parse(sessionStorage.getItem('lite')));
    snapshots = new class extends Array {
        push(...args) {
            if (this.length >= parseInt(lite.storage.get('snapshots'))) {
                this.splice(0, this.length - parseInt(lite.storage.get('snapshots')));
            }

            super.push(...args);
        }
    }

	constructor() {
        if ('GameManager' in globalThis) {
            GameManager.on('stateChange', (state) => {
                if (state.preloading === false && this.loaded === false) {
                    this.loaded = this.load();
                }
            });
        }

        if ('Application' in globalThis) {
            Application.events.subscribe('route', () => this.loaded = false);
            Application.events.subscribe('mainview.loaded', this.childLoad.bind(this));
        }

        this.childLoad();
        addEventListener('message', ({ data }) => {
            switch(data.action) {
                case 'updateStorage':
                    this.storage = new StrongMap(data.storage);
                    break;
            }

            this.refresh();
        });
	}

	get game() {
        if (GameManager.hasOwnProperty('game') && GameManager.game !== null) {
            return GameManager.game;
        }

        return null;
    }

    get focusOverlay() {
        return this.game.gameContainer.querySelector(".gameFocusOverlay");
    }

    createAccountContainer({ login, password }) {
        let container = this.constructor.createElement("div", {
            children: [
                this.constructor.createElement("button", {
                    class: "new-button button-type-1",
                    innerText: login,
                    style: {
                        width: "82%"
                    },
                    click() {
                        document.querySelector("#simplemodal-overlay")?.remove();
                        document.querySelector("#signup_login_container")?.remove();
                        Application.Helpers.AjaxHelper.post("/auth/standard_login", { login, password }).done(function(response) {
                            response.result && Application.events.publish("auth.login", response.data.user, response.data.user_stats);
                        });
                    }
                }),
                this.constructor.createElement("button", {
                    class: "btn new-button button-type-1 moderator-remove-race",
                    innerText: "X",
                    style: {
                        height: "100%",
                        'margin-right': 0,
                        width: "16%"
                    },
                    click() {
                        let accounts = JSON.parse(localStorage.getItem("switcher-accounts")) ?? [];
                        accounts.splice(accounts.indexOf(accounts.find((account) => account.login === login)), 1);

                        localStorage.setItem("switcher-accounts", JSON.stringify(accounts));

                        container.remove();
                    }
                })
            ],
            style: {
                display: "flex",
                'justify-content': "space-between",
                margin: "4px",
                width: "100%"
            }
        });
    
        return container;
    }

    load() {
        this.snapshots.splice(0, this.snapshots.length);
        // window.createjs.Ticker.on('tick', this.update.bind(this));
        this.refresh();
        return true;
    }

	childLoad() {
        if (location.pathname.match(/^\/t\//gi) && this.storage.get('featuredGhostsDisplay')) {
            fetch("https://raw.githubusercontent.com/Calculamatrise/frhd_featured_ghosts/master/display.js").then(r => r.text()).then(data => {
                document.head.appendChild(Object.assign(document.createElement("script"), {
                    innerHTML: data,
                    onload: function() {
                        this.remove()
                    }
                }));
            })
        }

		if (location.pathname.match(/^\/u\//i)) {
            Application.Helpers.AjaxHelper.get(location.pathname).done((response) => {
                if (!document.querySelector(".friend-list.friends-all.active")) return;
				for (const element of document.querySelector(".friend-list.friends-all.active").children) {
					if (element.querySelector(".friend-list-item-date") !== null) return;
                    element.querySelector(".friend-list-item-info").appendChild(this.constructor.createElement("div", {
                        class: "friend-list-item-date",
                        innerText: "Last Played " + response.friends.friends_data.find((user) => user.d_name == element.querySelector(".friend-list-item-name.bold").innerText).activity_time_ago
                    }));
				}
            });
		}

        if (this.storage.get('multi-account')) {
            let logout = document.querySelector("a.logout");
            logout.removeAttribute("id");
            logout.innerText = "Switch";
            logout.addEventListener("click", function() {
                let overlay = this.constructor.createElement("div", {
                    class: "simplemodal-overlay",
                    id: "simplemodal-overlay",
                    style: {
                        height: "100%",
                        left: 0,
                        opacity: 0.5,
                        position: "fixed",
                        top: 0,
                        width: "100%",
                        'z-index': 1001
                    }
                });
        
                let container = this.constructor.createElement("div", {
                    children: [
                        this.constructor.createElement("span", {
                            class: "core_icons core_icons-icon_close signup-login-modal-close",
                            click() {
                                overlay.remove();
                                container.remove();
                            }
                        }),
                        this.constructor.createElement("div", {
                            children: (JSON.parse(localStorage.getItem("switcher-accounts")) ?? []).map((account) => createUserElement(account)),
                            id: "accounts-container",
                            style: {
                                display: "flex",
                                'flex-direction': "column"
                            }
                        }),
                        this.constructor.createElement("button", {
                            class: "btn new-button button-type-2",
                            innerText: "Add account",
                            style: {
                                'font-size': "16px",
                                height: "36px",
                                margin: "4px",
                                width: "100%"
                            },
                            click() {
                                if (document.querySelector("div#login-container")) {
                                    this.innerText = "Add account";
                                    this.classList.remove("moderator-remove-race");
                                    document.querySelector("div#login-container").remove();
                                    return;
                                }
        
                                this.before(this.constructor.createElement("div", {
                                    children: [
                                        this.constructor.createElement("input", {
                                            class: "field auth-field",
                                            id: "save-account-login",
                                            placeholder: "Username or Email",
                                            style: {
                                                'border-radius': "20px",
                                                margin: "4px",
                                                width: "100%"
                                            },
                                            type: "text"
                                        }),
                                        this.constructor.createElement("input", {
                                            class: "field auth-field",
                                            id: "save-account-password",
                                            placeholder: "Password",
                                            style: {
                                                'border-radius': "20px",
                                                margin: "4px",
                                                width: "100%"
                                            },
                                            type: "password"
                                        }),
                                        this.constructor.createElement("button", {
                                            class: "new-button button-type-1",
                                            innerText: "Save account",
                                            style: {
                                                margin: "4px",
                                                width: "100%"
                                            },
                                            click() {
                                                Application.Helpers.AjaxHelper.post("/auth/standard_login", { login: document.querySelector("#save-account-login")?.value, password: document.querySelector("#save-account-password")?.value }).done((response) => {
                                                    if (response.result) {
                                                        let accounts = JSON.parse(localStorage.getItem("switcher-accounts")) || [];
                                                        if (accounts.find(({ login }) => login === response.data.user.d_name)) {
                                                            return;
                                                        }
        
                                                        accounts.push({
                                                            login: response.data.user.d_name,
                                                            password: document.querySelector("#save-account-password")?.value
                                                        });
        
                                                        document.querySelector("#accounts-container")?.append(createUserElement(accounts[accounts.length - 1]));
        
                                                        localStorage.setItem("switcher-accounts", JSON.stringify(accounts));
                                                        this.parentElement.remove();
                                                    }
                                                });
                                            }
                                        })
                                    ],
                                    id: "login-container",
                                    style: {
                                        display: "flex",
                                        'flex-direction': "column",
                                        'margin-top': "16px"
                                    }
                                }));
                                this.classList.add("moderator-remove-race");
                                this.innerText = "Cancel";
                            }
                        })
                    ],
                    class: "simplemodal-container",
                    id: "signup_login_container",
                    style: {
                        display: "flex",
                        'flex-direction': "column",
                        height: "50%",
                        left: "36%",
                        padding: "50px",
                        position: "fixed",
                        top: "25%",
                        width: "360px",
                        'z-index': 1002
                    }
                });
        
                document.body.append(overlay, container);
            });
        }
	}

    refresh() {
        let keymap = this.storage.get('keymap');
        this.game.currentScene.playerManager.firstPlayer._gamepad.setKeyMap(this.game.settings[(this.game.currentScene.hasOwnProperty('races') ? 'play' : 'editor') + 'Hotkeys']);
        for (let key in keymap) {
            this.game.currentScene.playerManager.firstPlayer._gamepad.keymap[key.charCodeAt()] = keymap[key];
        }

        // this.game.currentScene.message.color = (lite.storage.get('theme') === 'midnight' || lite.storage.get('theme') === 'dark') ? "#ccc" : "#333";
        this.game.currentScene.score.best_time.color = (lite.storage.get('theme') === 'midnight' || lite.storage.get('theme') === 'dark') ? "#888" : "#999";
        this.game.currentScene.score.best_time_title.color = (lite.storage.get('theme') === 'midnight' || lite.storage.get('theme') === 'dark') ? "#888" : "#999";
        this.game.currentScene.score.goals.color = lite.storage.get('theme') === 'midnight' ? "#ddd" : lite.storage.get('theme') === 'dark' ? "#fff" : "#000";
        this.game.currentScene.score.time.color = lite.storage.get('theme') === 'midnight' ? "#ddd" : lite.storage.get('theme') === 'dark' ? "#fff" : "#000";
        this.game.currentScene.score.time_title.color = (lite.storage.get('theme') === 'midnight' || lite.storage.get('theme') === 'dark') ? "#888" : "#999";
        if (this.game.currentScene.hasOwnProperty('raceTimes')) {
            this.game.currentScene.raceTimes.container.color = lite.storage.get('theme') === 'midnight' ? "#ddd" : lite.storage.get('theme') === 'dark' ? "#fff" : "#000";
			// this.game.currentScene.raceTimes.raceList.forEach((race) => {
            //     race.children.forEach(element => {
            //         element.color = lite.storage.get('theme') === 'midnight' ? "#ddd" : lite.storage.get('theme') === 'dark' ? "#fff" : "#000";
            //     });
            // });
        }

        if (this.game.currentScene.hasOwnProperty('campaignScore')) {
			this.game.currentScene.campaignScore.container.color = lite.storage.get('theme') === 'midnight' ? "#ddd" : lite.storage.get('theme') === 'dark' ? "#fff" : "#000";
            this.game.currentScene.campaignScore.container.children.forEach(medal => {
				medal.color = lite.storage.get('theme') === 'midnight' ? "#ddd" : lite.storage.get('theme') === 'dark' ? "#fff" : "#000";
                // medal.children.forEach(element => {
                //     element.color = lite.storage.get('theme') === 'midnight' ? "#ddd" : lite.storage.get('theme') === 'dark' ? "#fff" : "#000";
                // });
            });
        }

        this.game.settings.physicsLineColor = this.storage.get('theme') === 'midnight' ? "#ccc" : this.storage.get('theme') === 'dark' ? "#fdfdfd" : "#000";
        this.game.settings.sceneryLineColor = this.storage.get('theme') === 'midnight' ? "#444" : this.storage.get('theme') === 'dark' ? "#666" : "#aaa";
        this.game.currentScene.toolHandler.options.gridMinorLineColor = this.storage.get('theme') === 'midnight' ? "#20282e" : this.storage.get('theme') === 'dark' ? "#252525" : "#eee";
        this.game.currentScene.toolHandler.options.gridMajorLineColor = this.storage.get('theme') === 'midnight' ? "#161b20" : this.storage.get('theme') === 'dark' ? "#3e3e3e" : "#ccc";
        this.game.canvas.style.setProperty("background-color", this.storage.get('theme') === 'midnight' ? "#1d2328" : this.storage.get('theme') === 'dark' ? "#1b1b1b" : "#fff");
        if (this.focusOverlay) {
            this.focusOverlay.style.setProperty("background-color", this.storage.get('theme') === 'midnight' ? "#333b" : this.storage.get('theme') === 'dark' ? "#000b" : "#fffb");
        }

        this.game.currentScene.redraw();
    }
    
    update() {
        this.storage.get('inputDisplay') && this.drawInputDisplay(this.game.canvas);
    }

	drawInputDisplay(canvas = document.createElement('canvas')) {
		const ctx = canvas.getContext('2d');
        const color = (condition => condition ? (theme => '#' + (theme === 'midnight' ? '444' : theme === 'dark' ? '000' : 'fff'))(this.storage.get('theme')) : fill);
        const fill = (theme => '#' + (theme === 'midnight' ? 'ddd' : theme === 'dark' ? 'fff' : '000'))(this.storage.get('theme'));
		const gamepad = this.game.currentScene.playerManager._players[this.game.currentScene.camera.focusIndex]._gamepad.downButtons;
		const size = parseInt(this.storage.get('inputDisplaySize'));
		const offset = {
			x: size,
			y: canvas.height - size * 10
		}

        ctx.save();
		ctx.fillStyle = fill;
        ctx.font = size * 3 + 'px Arial';
		ctx.lineCap = 'round';
		ctx.lineJoin = 'round';
		ctx.lineWidth = size / 2;
		ctx.strokeStyle = fill;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        ctx.beginPath();
		ctx.roundRect(offset.x, offset.y, size * 4, size * 4, 4);
        ctx.stroke();
        gamepad.z && ctx.fill();
        ctx.beginPath();
		ctx.roundRect(offset.x + 5 * size, offset.y, size * 4, size * 4, 4);
        ctx.stroke();
		gamepad.up && ctx.fill();
        ctx.beginPath();
		ctx.roundRect(offset.x, offset.y + 5 * size, size * 4, size * 4, 4);
        ctx.stroke();
		gamepad.left && ctx.fill();
        ctx.beginPath();
		ctx.roundRect(offset.x + 5 * size, offset.y + 5 * size, size * 4, size * 4, 4);
        ctx.stroke();
		gamepad.down && ctx.fill();
        ctx.beginPath();
		ctx.roundRect(offset.x + 10 * size, offset.y + 5 * size, size * 4, size * 4, 4);
        ctx.stroke();
		gamepad.right && ctx.fill();

		ctx.lineWidth = size / 3;
		ctx.strokeStyle = color(gamepad.z);
		ctx.beginPath();
        ctx.moveTo(offset.x + 2.7 * size, offset.y + 3 * size);
        ctx.lineTo(offset.x + 1.2 * size, offset.y + 3 * size);
        ctx.lineTo(offset.x + 2.7 * size, offset.y + 1 * size);
        ctx.lineTo(offset.x + 1.2 * size, offset.y + 1 * size);
        ctx.stroke();
		ctx.strokeStyle = color(gamepad.up);
		ctx.beginPath();
		ctx.moveTo(offset.x + 6.2 * size, offset.y + 2.7 * size);
		ctx.lineTo(offset.x + 7 * size, offset.y + 1.2 * size);
		ctx.lineTo(offset.x + 7.8 * size, offset.y + 2.7 * size);
		ctx.stroke();
		ctx.strokeStyle = color(gamepad.left);
		ctx.beginPath();
		ctx.moveTo(offset.x + 2.5 * size, offset.y + 7.8 * size);
		ctx.lineTo(offset.x + 1.2 * size, offset.y + 7 * size);
		ctx.lineTo(offset.x + 2.5 * size, offset.y + 6.2 * size);
		ctx.stroke();
		ctx.strokeStyle = color(gamepad.down);
		ctx.beginPath();
		ctx.moveTo(offset.x + 6.2 * size, offset.y + 6.2 * size);
		ctx.lineTo(offset.x + 7 * size, offset.y + 7.8 * size);
		ctx.lineTo(offset.x + 7.8 * size, offset.y + 6.2 * size);
		ctx.stroke();
		ctx.strokeStyle = color(gamepad.right);
		ctx.beginPath();
		ctx.moveTo(offset.x + 11.5 * size, offset.y + 7.8 * size);
		ctx.lineTo(offset.x + 12.8 * size, offset.y + 7 * size);
		ctx.lineTo(offset.x + 11.5 * size, offset.y + 6.2 * size);
		ctx.stroke();
        ctx.restore();
	}

	static createElement(type, options) {
        let element = document.createElement(type);
        for (const attribute in options) {
            if (typeof options[attribute] === "object") {
                if (attribute === "style") {
                    for (const property in options[attribute]) {
                        element.style.setProperty(property, options[attribute][property]);
                    }
                } else if (attribute === "children") {
                    element.append(...options[attribute]);
                }
            } else if (typeof options[attribute] === "function") {
                element.addEventListener(attribute, options[attribute]);
            } else {
                if (attribute.startsWith("inner")) {
                    element[attribute] = options[attribute];
                } else {
                    element.setAttribute(attribute, options[attribute]);
                }
            }
        }
    
        return element;
    }
}