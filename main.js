import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut, updateProfile } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyAREAKIOALEn-z7NxmaOTQHB_grmE0vHS0",
    authDomain: "athul-music-web.firebaseapp.com",
    projectId: "athul-music-web",
    storageBucket: "athul-music-web.firebasestorage.app",
    messagingSenderId: "391677310512",
    appId: "1:391677310512:web:6005de002b73cdf8bc1ff5"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const STATIC_LIBRARY = [
    { title: "Soul of Doctor (Theme) From Doctor", artist: "Anirudh Ravichander, Niranjana Ramanan", url: "m1.mp3", cover: "1.jpg" },
    { title: "Rockaankuthu", artist: "Anirudh Ravichander", url: "songs/music2.mp3", cover: "2.jpg" },
    { title: "Dippam Dappam (From Kaathuvaakula Rendu Kaadhal)", artist: "Anirudh Ravichander/Anthony Daasan", url: "songs/sky_high.mp3", cover: "3.jpg" }
];

const App = {
    state: {
        user: null, view: 'login', isPlaying: false, isShuffle: false,
        isRepeat: false, currentIndex: 0, searchQuery: '', library: STATIC_LIBRARY
    },

    init() {
        this.showLoader(2500);
        onAuthStateChanged(auth, (user) => {
            this.state.user = user;
            if (user) { this.state.view = 'home'; this.loadTrack(0, false); }
            else { if (this.state.view !== 'signup') this.state.view = 'login'; }
            this.render();
        });

        this.audio = new Audio();
        this.audio.onplay = () => { this.state.isPlaying = true; this.render(); };
        this.audio.onpause = () => { this.state.isPlaying = false; this.render(); };
        this.audio.onended = () => this.state.isRepeat ? this.audio.play() : this.next();
        this.audio.ontimeupdate = () => {
            const fill = document.querySelector('.progress-fill');
            if (fill && this.audio.duration) fill.style.width = (this.audio.currentTime / this.audio.duration) * 100 + "%";
        };
    },

    showLoader(ms) {
        const l = document.getElementById('loader-overlay');
        if (!l) return;
        l.classList.remove('loader-hidden');
        setTimeout(() => l.classList.add('loader-hidden'), ms);
    },

    async handleAuth(type) {
        const e = document.getElementById('email-in')?.value;
        const p = document.getElementById('pass-in')?.value;
        const name = document.getElementById('name-in')?.value;

        try {
            if (type === 'login') {
                this.showLoader(2000);
                await signInWithEmailAndPassword(auth, e, p);
            } else if (type === 'signup') {
                const cp = document.getElementById('confirm-p-in')?.value;
                if (p !== cp) throw new Error("Passwords mismatch!");
                this.showLoader(2500);
                const res = await createUserWithEmailAndPassword(auth, e, p);
                await updateProfile(res.user, { 
                    displayName: name,
                    photoURL: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}` 
                });
                location.reload();
            } else if (type === 'logout') { await signOut(auth); }
        } catch (err) { alert(err.message); document.getElementById('loader-overlay')?.classList.add('loader-hidden'); }
    },

    loadTrack(i, play = true) {
        if (!this.state.library[i]) return;
        this.state.currentIndex = i;
        this.audio.src = this.state.library[i].url;
        if (play) this.audio.play();
        this.render();
    },

    switchView(v) { this.state.view = v; this.render(); },
    togglePlay() { this.audio.paused ? this.audio.play() : this.audio.pause(); },
    next() { let i = this.state.isShuffle ? Math.floor(Math.random() * this.state.library.length) : (this.state.currentIndex + 1) % this.state.library.length; this.loadTrack(i); },
    prev() { let i = (this.state.currentIndex - 1 + this.state.library.length) % this.state.library.length; this.loadTrack(i); },

    render() {
        const root = document.getElementById('app-root');
        const loader = `<div id="loader-overlay" class="loader-hidden"><div class="cassette"><div class="reel"></div><div class="reel"></div></div><p class="loader-text">Syncing Tape...</p></div>`;
        const viewContent = !this.state.user ? 
            (this.state.view === 'signup' ? this.templates.signup() : this.templates.login()) :
            (this.templates[this.state.view]() + this.templates.navbar());
        root.innerHTML = loader + viewContent;
        lucide.createIcons();
    },

    templates: {
        login: () => `<div class="view flex-center"><div class="glass auth-card"><h1>AthulMusic</h1><p>Premium Audio Experience</p><input type="email" id="email-in" placeholder="Email" class="premium-input"><input type="password" id="pass-in" placeholder="Password" class="premium-input"><button onclick="App.handleAuth('login')" class="btn-primary">Sign In</button><button onclick="App.switchView('signup')" style="background:none;border:none;color:#555;margin-top:20px;cursor:pointer;">New? Create Account</button></div></div>`,
        signup: () => `<div class="view flex-center"><div class="glass auth-card"><h2>Register</h2><input type="text" id="name-in" placeholder="Full Name" class="premium-input"><input type="email" id="email-in" placeholder="Email" class="premium-input"><input type="password" id="pass-in" placeholder="Password" class="premium-input"><input type="password" id="confirm-p-in" placeholder="Confirm Password" class="premium-input"><button onclick="App.handleAuth('signup')" class="btn-primary">Get Started</button><button onclick="App.switchView('login')" style="background:none;border:none;color:#555;margin-top:20px;cursor:pointer;">Back to Login</button></div></div>`,
        home: () => `
            <div class="view">
                <header class="home-header">
                    <div><small style="color:#666">Welcome back,</small><h2 style="margin:0">${App.state.user.displayName || 'Listener'}</h2></div>
                    <img src="${App.state.user.photoURL}" class="mini-avatar" onclick="App.switchView('profile')">
                </header>
                <div class="search-wrapper"><i data-lucide="search" size="18"></i><input type="text" placeholder="Search Studio..." oninput="App.state.searchQuery=this.value.toLowerCase(); App.render();"></div>
                <div class="song-list">
                    ${App.state.library.filter(s => s.title.toLowerCase().includes(App.state.searchQuery)).map((t, i) => `
                        <div class="song-card" onclick="App.loadTrack(${App.state.library.indexOf(t)})">
                            <img src="${t.cover}" style="width:50px;height:50px;border-radius:12px;object-fit:cover;">
                            <div style="flex:1;"><b>${t.title}</b><br><small style="color:#666">${t.artist}</small></div>
                            <i data-lucide="${App.state.currentIndex === App.state.library.indexOf(t) && App.state.isPlaying ? 'pause' : 'play'}" size="18"></i>
                        </div>`).join('')}
                </div>
            </div>`,
        player: () => `
            <div class="view text-center">
                <header class="home-header"><i data-lucide="chevron-down" onclick="App.switchView('home')"></i><b>STUDIO PLAYER</b><i></i></header>
                <img src="${App.state.library[App.state.currentIndex].cover}" class="main-art glass">
                <h2 style="margin:15px 0 5px">${App.state.library[App.state.currentIndex].title}</h2>
                <p style="color:var(--accent);font-weight:700">${App.state.library[App.state.currentIndex].artist}</p>
                <div class="progress-bar" onclick="const r=this.getBoundingClientRect(); App.audio.currentTime=((event.clientX-r.left)/r.width)*App.audio.duration;"><div class="progress-fill"></div></div>
                <div style="display:flex; justify-content:space-around; align-items:center;">
                    <i data-lucide="shuffle" class="${App.state.isShuffle?'active-nav':''}" onclick="App.state.isShuffle=!App.state.isShuffle;App.render()"></i>
                    <i data-lucide="skip-back" onclick="App.prev()"></i>
                    <div onclick="App.togglePlay()" class="play-circle"><i data-lucide="${App.state.isPlaying?'pause':'play'}" fill="black"></i></div>
                    <i data-lucide="skip-forward" onclick="App.next()"></i>
                    <i data-lucide="repeat" class="${App.state.isRepeat?'active-nav':''}" onclick="App.state.isRepeat=!App.state.isRepeat;App.render()"></i>
                </div>
            </div>`,
        profile: () => `<div class="view flex-center"><div class="glass auth-card"><img src="${App.state.user.photoURL}" style="width:100px;border-radius:50%;margin-bottom:15px;border:3px solid var(--accent)"><h2>${App.state.user.displayName}</h2><p>${App.state.user.email}</p><button onclick="App.handleAuth('logout')" style="background:none;border:1px solid #ff4444;color:#ff4444;padding:10px 20px;border-radius:10px;cursor:pointer;">Log Out</button></div></div>`,
        navbar: () => `<nav class="nav-bar"><i data-lucide="home" onclick="App.switchView('home')" class="${App.state.view==='home'?'active-nav':''}"></i><i data-lucide="music" onclick="App.switchView('player')" class="${App.state.view==='player'?'active-nav':''}"></i><i data-lucide="user" onclick="App.switchView('profile')" class="${App.state.view==='profile'?'active-nav':''}"></i></nav>`
    }
};

App.init();
window.App = App;
