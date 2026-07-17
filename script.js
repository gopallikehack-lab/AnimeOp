const ANILIST_API = "https://graphql.anilist.co";
const CONSUMET_API = "https://api.consumet.org/anime/gogoanime";

// ===== PAGES =====
function showPage(page) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById('page-' + page).classList.add('active');
    document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('active'));
    const links = document.querySelectorAll('.nav-links a');
    const map = { home: 0, search: 1, popular: 2 };
    if (map[page] !== undefined) links[map[page]].classList.add('active');
}

// ===== FETCH FROM ANILIST =====
async function fetchAnilist(query, variables = {}) {
    const res = await fetch(ANILIST_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, variables })
    });
    return res.json();
}

// ===== LOAD HOME =====
async function loadHome() {
    const grid = document.getElementById('trendingGrid');
    grid.innerHTML = '<div class="loading">Loading...</div>';
    const query = `
        query {
            Page(page: 1, perPage: 20) {
                media(type: ANIME, sort: TRENDING_DESC) {
                    id
                    title { romaji english }
                    episodes
                    coverImage { large }
                    averageScore
                }
            }
        }
    `;
    try {
        const data = await fetchAnilist(query);
        const anime = data.data.Page.media;
        grid.innerHTML = anime.map(a => cardHTML(a)).join('');
    } catch (e) {
        grid.innerHTML = '<div class="loading">Error loading</div>';
    }
}

// ===== LOAD POPULAR =====
async function loadPopular() {
    const grid = document.getElementById('popularGrid');
    grid.innerHTML = '<div class="loading">Loading...</div>';
    const query = `
        query {
            Page(page: 1, perPage: 20) {
                media(type: ANIME, sort: POPULARITY_DESC) {
                    id
                    title { romaji english }
                    episodes
                    coverImage { large }
                    averageScore
                }
            }
        }
    `;
    try {
        const data = await fetchAnilist(query);
        const anime = data.data.Page.media;
        grid.innerHTML = anime.map(a => cardHTML(a)).join('');
    } catch (e) {
        grid.innerHTML = '<div class="loading">Error loading</div>';
    }
}

// ===== SEARCH =====
async function searchAnime() {
    const query = document.getElementById('searchInput').value.trim();
    const grid = document.getElementById('searchGrid');
    if (!query) { grid.innerHTML = '<div class="loading">Search for anime...</div>'; return; }
    grid.innerHTML = '<div class="loading">Searching...</div>';
    const q = `
        query($search: String) {
            Page(page: 1, perPage: 20) {
                media(type: ANIME, search: $search) {
                    id
                    title { romaji english }
                    episodes
                    coverImage { large }
                    averageScore
                }
            }
        }
    `;
    try {
        const data = await fetchAnilist(q, { search: query });
        const anime = data.data.Page.media;
        if (anime.length > 0) {
            grid.innerHTML = anime.map(a => cardHTML(a)).join('');
        } else {
            grid.innerHTML = '<div class="loading">No results found.</div>';
        }
    } catch (e) {
        grid.innerHTML = '<div class="loading">Error searching</div>';
    }
}

// ===== SHOW ANIME DETAIL + EPISODES =====
async function showAnime(id) {
    const page = document.getElementById('detailPage');
    const content = document.getElementById('detailContent');
    const epGrid = document.getElementById('episodeGrid');
    page.classList.add('active');
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    page.classList.add('active');
    content.innerHTML = '<div class="loading">Loading...</div>';
    epGrid.innerHTML = '';

    const query = `
        query($id: Int) {
            Media(id: $id, type: ANIME) {
                id
                title { romaji english }
                description
                episodes
                coverImage { large }
                averageScore
                genres
                status
                format
                duration
            }
        }
    `;
    try {
        const data = await fetchAnilist(query, { id });
        const a = data.data.Media;
        content.innerHTML = `
            <div class="detail-header">
                <img src="${a.coverImage.large}" alt="${a.title.romaji}" />
                <div class="info">
                    <h2>${a.title.romaji}</h2>
                    <p>${a.description ? a.description.replace(/<[^>]*>/g, '').slice(0, 300) + '...' : 'No description.'}</p>
                    <div class="detail-meta">
                        <span>⭐ ${a.averageScore ? (a.averageScore/10).toFixed(1) : 'N/A'}</span>
                        <span>📺 ${a.episodes || '?'} eps</span>
                        <span>📂 ${a.format || 'N/A'}</span>
                        <span>📅 ${a.status || 'N/A'}</span>
                        <span>⏱️ ${a.duration || '?'} min</span>
                    </div>
                    <div>🎯 ${a.genres ? a.genres.join(', ') : 'N/A'}</div>
                </div>
            </div>
        `;
        // Load episodes
        await loadEpisodes(a.id, a.title.romaji);
    } catch (e) {
        content.innerHTML = '<div class="loading">Error loading details</div>';
    }
}

// ===== LOAD EPISODES FROM CONSUMET =====
async function loadEpisodes(anilistId, title) {
    const grid = document.getElementById('episodeGrid');
    grid.innerHTML = '<div class="loading">Loading episodes...</div>';
    try {
        // Search for anime on Gogoanime via Consumet
        const searchRes = await fetch(`${CONSUMET_API}/search?q=${encodeURIComponent(title)}`);
        const searchData = await searchRes.json();
        if (!searchData.results || searchData.results.length === 0) {
            grid.innerHTML = '<div class="loading">No episodes found.</div>';
            return;
        }
        const animeId = searchData.results[0].id;
        const epRes = await fetch(`${CONSUMET_API}/info/${animeId}`);
        const epData = await epRes.json();
        if (epData.episodes && epData.episodes.length > 0) {
            grid.innerHTML = epData.episodes.map(ep => `
                <button class="episode-btn" onclick="playEpisode('${ep.id}', '${title} - ${ep.number || 'Episode'}')">
                    ${ep.number ? 'Episode ' + ep.number : 'Episode'}
                </button>
            `).join('');
        } else {
            grid.innerHTML = '<div class="loading">No episodes available.</div>';
        }
    } catch (e) {
        console.error(e);
        grid.innerHTML = '<div class="loading">Error loading episodes. Try another anime.</div>';
    }
}

// ===== PLAY EPISODE =====
async function playEpisode(episodeId, title) {
    const modal = document.getElementById('playerModal');
    const player = document.getElementById('player');
    const titleEl = document.getElementById('playerTitle');
    titleEl.textContent = title;
    modal.classList.add('show');
    player.src = '';
    player.poster = 'https://via.placeholder.com/800x450?text=Loading...';
    try {
        const res = await fetch(`${CONSUMET_API}/watch/${episodeId}`);
        const data = await res.json();
        if (data.sources && data.sources.length > 0) {
            // Get best quality source
            const source = data.sources.find(s => s.quality === '1080p') || data.sources[0];
            player.src = source.url;
            player.load();
            player.play();
        } else {
            alert('No stream available for this episode.');
        }
    } catch (e) {
        alert('Error loading stream.');
        console.error(e);
    }
}

// ===== CARD HTML =====
function cardHTML(a) {
    const img = a.coverImage?.large || 'https://via.placeholder.com/200x300';
    const title = a.title?.romaji || a.title?.english || 'Unknown';
    const score = a.averageScore ? (a.averageScore/10).toFixed(1) : 'N/A';
    return `
        <div class="card" onclick="showAnime(${a.id})">
            <img src="${img}" alt="${title}" loading="lazy" />
            <div class="info">
                <div class="title">${title}</div>
                <div class="meta">
                    <span>⭐ ${score}</span>
                    <span>${a.episodes || '?'} eps</span>
                </div>
            </div>
        </div>
    `;
}

// ===== PLAYER CONTROLS =====
function closePlayer() {
    const player = document.getElementById('player');
    player.pause();
    player.src = '';
    document.getElementById('playerModal').classList.remove('show');
}

document.getElementById('playerModal').addEventListener('click', function(e) {
    if (e.target === this) closePlayer();
});

document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') closePlayer();
});

// ===== INIT =====
loadHome();
loadPopular();
console.log('🎬 AnimeOP • Streaming • By ~GpSirEra');
