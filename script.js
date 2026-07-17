const API_BASE = "https://api.jikan.moe/v4";

// ===== PAGES =====
function showPage(page) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById('page-' + page).classList.add('active');
    document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('active'));
    const links = document.querySelectorAll('.nav-links a');
    const map = { home: 0, search: 1, top: 2, genres: 3 };
    if (map[page] !== undefined) links[map[page]].classList.add('active');
}

// ===== LOAD HOME =====
async function loadHome() {
    const grid = document.getElementById('trendingGrid');
    grid.innerHTML = '<div class="loading">Loading...</div>';
    try {
        const res = await fetch(`${API_BASE}/top/anime?limit=20`);
        const data = await res.json();
        grid.innerHTML = data.data.map(a => cardHTML(a)).join('');
    } catch (e) {
        grid.innerHTML = '<div class="loading">Error loading</div>';
    }
}

// ===== SEARCH =====
async function searchAnime() {
    const query = document.getElementById('searchInput').value.trim();
    const lang = document.getElementById('langSelect').value;
    const grid = document.getElementById('searchGrid');
    if (!query) { grid.innerHTML = '<div class="loading">Search for anime...</div>'; return; }
    grid.innerHTML = '<div class="loading">Searching...</div>';
    try {
        let url = `${API_BASE}/anime?q=${encodeURIComponent(query)}&limit=24`;
        if (lang) url += `&language=${lang}`;
        const res = await fetch(url);
        const data = await res.json();
        if (data.data && data.data.length > 0) {
            grid.innerHTML = data.data.map(a => cardHTML(a)).join('');
        } else {
            grid.innerHTML = '<div class="loading">No results found.</div>';
        }
    } catch (e) {
        grid.innerHTML = '<div class="loading">Error searching</div>';
    }
}

// ===== LOAD TOP =====
async function loadTop(type) {
    document.querySelectorAll('#page-top .filters button').forEach(b => b.classList.remove('active'));
    event.target.classList.add('active');
    const grid = document.getElementById('topGrid');
    grid.innerHTML = '<div class="loading">Loading...</div>';
    try {
        let url = `${API_BASE}/top/anime`;
        if (type !== 'all') url += `?type=${type}`;
        const res = await fetch(url);
        const data = await res.json();
        grid.innerHTML = data.data.map(a => cardHTML(a)).join('');
    } catch (e) {
        grid.innerHTML = '<div class="loading">Error loading</div>';
    }
}

// ===== LOAD GENRES =====
async function loadGenres() {
    const grid = document.getElementById('genreGrid');
    try {
        const res = await fetch(`${API_BASE}/genres/anime`);
        const data = await res.json();
        grid.innerHTML = data.data.map(g => `<span class="genre-tag" onclick="loadGenreAnime(${g.mal_id})">${g.name}</span>`).join('');
    } catch (e) {
        grid.innerHTML = 'Error loading genres';
    }
}

async function loadGenreAnime(id) {
    const grid = document.getElementById('genreAnimeGrid');
    grid.innerHTML = '<div class="loading">Loading...</div>';
    try {
        const res = await fetch(`${API_BASE}/anime?genres=${id}&limit=20`);
        const data = await res.json();
        grid.innerHTML = data.data.map(a => cardHTML(a)).join('');
        grid.scrollIntoView({ behavior: 'smooth' });
    } catch (e) {
        grid.innerHTML = '<div class="loading">Error loading</div>';
    }
}

// ===== DETAIL MODAL =====
async function showDetail(id) {
    const modal = document.getElementById('detailModal');
    const body = document.getElementById('detailBody');
    modal.classList.add('show');
    body.innerHTML = '<div class="loading">Loading...</div>';
    try {
        const res = await fetch(`${API_BASE}/anime/${id}/full`);
        const a = await res.json();
        const data = a.data;
        body.innerHTML = `
            <span class="close" onclick="closeDetail()">&times;</span>
            <h2>${data.title}</h2>
            <img src="${data.images.jpg.large_image_url}" alt="${data.title}" style="width:100%;max-height:400px;object-fit:cover;" />
            <div class="detail-meta">
                <span>⭐ ${data.score || 'N/A'}</span>
                <span>📺 ${data.episodes || '?'} eps</span>
                <span>📅 ${data.year || 'N/A'}</span>
                <span>📂 ${data.type || 'N/A'}</span>
                <span>🔞 ${data.rating || 'N/A'}</span>
            </div>
            <p><strong>Synopsis:</strong> ${data.synopsis || 'No synopsis available.'}</p>
            <p><strong>Genres:</strong> ${data.genres.map(g => g.name).join(', ') || 'N/A'}</p>
            <p><strong>Studios:</strong> ${data.studios.map(s => s.name).join(', ') || 'N/A'}</p>
            <p><strong>Status:</strong> ${data.status || 'N/A'}</p>
            <p><strong>Source:</strong> ${data.source || 'N/A'}</p>
        `;
    } catch (e) {
        body.innerHTML = '<div class="loading">Error loading details</div>';
    }
}

function closeDetail() {
    document.getElementById('detailModal').classList.remove('show');
}

// ===== CARD HTML =====
function cardHTML(a) {
    const img = a.images?.jpg?.image_url || a.images?.jpg?.large_image_url || 'https://via.placeholder.com/200x300';
    return `
        <div class="card" onclick="showDetail(${a.mal_id})">
            <img src="${img}" alt="${a.title}" loading="lazy" />
            <div class="info">
                <div class="title">${a.title}</div>
                <div class="meta">
                    <span>⭐ ${a.score || 'N/A'}</span>
                    <span>${a.episodes || '?'} eps</span>
                </div>
            </div>
        </div>
    `;
}

// ===== CLOSE MODAL ON OUTSIDE =====
document.getElementById('detailModal').addEventListener('click', function(e) {
    if (e.target === this) closeDetail();
});

// ===== INIT =====
loadHome();
loadGenres();
loadTop('all');
console.log('🎬 AnimeOP • By ~GpSirEra');
