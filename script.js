// 陣形定義 (800x450プレビュー用)
// バンド向けに調整：index 0=Dr(後方中心), 1=Vo(前方中心), 2=Gt(左), 3=Ba(右) 等
const FORMATION_TYPES = {
    imperial_cross: {
        name: "インペリアルクロス", minMembers: 5,
        coords: [
            { x: 650, y: 225 }, // Dr (中央奥)
            { x: 450, y: 225 }, // Vo (中央前)
            { x: 550, y: 125 }, // Gt (左)
            { x: 550, y: 325 }, // Ba (右)
            { x: 550, y: 225 }, // Key/Other (中央中)
            { x: 750, y: 225 }, { x: 700, y: 100 }, { x: 700, y: 350 }, { x: 450, y: 100 }
        ]
    },
    triangle: {
        name: "トライアングル", minMembers: 3,
        coords: [
            { x: 650, y: 225 }, // Dr
            { x: 500, y: 150 }, // Member 2
            { x: 500, y: 300 }, // Member 3
            { x: 400, y: 225 }, { x: 550, y: 100 }, { x: 550, y: 350 },
            { x: 300, y: 225 }, { x: 600, y: 50 }, { x: 600, y: 400 }
        ]
    },
    diamond: {
        name: "ダイヤモンド", minMembers: 4,
        coords: [
            { x: 700, y: 225 }, // Dr
            { x: 450, y: 225 }, // Vo
            { x: 575, y: 125 }, // Gt
            { x: 575, y: 325 }, // Ba
            { x: 650, y: 125 }, { x: 650, y: 325 },
            { x: 500, y: 100 }, { x: 500, y: 350 }, { x: 350, y: 225 }
        ]
    },
    v_shape: {
        name: "V字", minMembers: 3,
        coords: [
            { x: 700, y: 225 }, // 1
            { x: 550, y: 125 }, { x: 550, y: 325 }, // 2, 3
            { x: 400, y: 50 },  { x: 400, y: 400 }, // 4, 5
            { x: 600, y: 225 }, { x: 500, y: 225 }, { x: 450, y: 150 }, { x: 450, y: 300 }
        ]
    },
    line_front: {
        name: "一列（前）", minMembers: 1,
        coords: [
            { x: 450, y: 225 }, { x: 450, y: 150 }, { x: 450, y: 300 },
            { x: 450, y: 75 },  { x: 450, y: 375 }, { x: 450, y: 10 },
            { x: 450, y: 440 }, { x: 550, y: 225 }, { x: 550, y: 150 }
        ]
    }
};

// 状態管理
let members = [
    { name: "ハギ", part: "Dr", icon: "hagi.png", selected: true },
    { name: "カズヤ", part: "Gt", icon: "kazuya.png", selected: true },
    { name: "シュウヘイ", part: "Gt", icon: "shuhei.png", selected: true },
    { name: "オグラ", part: "Ba", icon: "ogu.png", selected: false },
    { name: "コデラ", part: "Gt", icon: "kodera.png", selected: false },
    { name: "らいあん", part: "Gt", icon: "raian.png", selected: false },
    { name: "しゅが", part: "Gt", icon: "sugar.png", selected: false },
    { name: "ハットリ", part: "Gt", icon: "hattori.png", selected: false },
    { name: "ニシオ", part: "Gt", icon: "nishio.png", selected: false }
];

let userOverrides = {}; // { formationKey: { memberIndex: {x, y} } }
let isDragging = false;
let dragElement = null;
let dragMemberIdx = null;

// データの保存
function saveData() {
    localStorage.setItem('jinkei_members_v3', JSON.stringify(members));
    localStorage.setItem('jinkei_overrides', JSON.stringify(userOverrides));
    localStorage.setItem('jinkei_venue', document.getElementById('input-venue').value);
    localStorage.setItem('jinkei_live_title', document.getElementById('input-live-title').value);
    localStorage.setItem('jinkei_type', document.getElementById('jinkei-type').value);
    localStorage.setItem('jinkei_bg', document.getElementById('bg-select').value);
    localStorage.setItem('jinkei_speaker', document.getElementById('speaker-select').value);
}

// データの読み込み
function loadData() {
    const savedMembers = localStorage.getItem('jinkei_members_v3');
    if (savedMembers) {
        members = JSON.parse(savedMembers);
        // 古いパス（assets/icons/）が含まれていたら削除するクリーニング
        members.forEach(m => {
            if (m.icon && m.icon.includes('/')) m.icon = m.icon.split('/').pop();
        });
    }
    
    const savedOverrides = localStorage.getItem('jinkei_overrides');
    if (savedOverrides) userOverrides = JSON.parse(savedOverrides);

    document.getElementById('input-venue').value = localStorage.getItem('jinkei_venue') || "";
    document.getElementById('input-live-title').value = localStorage.getItem('jinkei_live_title') || "";
    document.getElementById('jinkei-type').value = localStorage.getItem('jinkei_type') || "imperial_cross";

    let bg = localStorage.getItem('jinkei_bg') || "galaxy.png";
    // 古いパス（assets/bg/）が含まれていたら削除
    if (bg.includes('/')) bg = bg.split('/').pop();
    document.getElementById('bg-select').value = bg;
    document.getElementById('speaker-select').value = localStorage.getItem('jinkei_speaker') || "-1";
    
    document.getElementById('battle-bg').src = document.getElementById('bg-select').value;
}

// UI生成
function renderSpeakerSelect() {
    const select = document.getElementById('speaker-select');
    const currentVal = select.value;
    select.innerHTML = '<option value="-1">なし（バナー表示のみ）</option>';
    
    members.forEach((m, i) => {
        if (m.selected) {
            const opt = document.createElement('option');
            opt.value = i;
            opt.innerText = `${m.part} ${m.name}`;
            select.appendChild(opt);
        }
    });
    select.value = currentVal;
}

function renderMemberToggles() {
    const list = document.getElementById('member-toggles-list');
    list.innerHTML = '';
    members.forEach((m, i) => {
        const btn = document.createElement('button');
        btn.className = `member-toggle ${m.selected ? 'active' : ''}`;
        btn.innerText = `${m.part} ${m.name}`;
        btn.onclick = () => toggleMember(i);
        list.appendChild(btn);
    });
}

function renderMemberRows() {
    const tbody = document.getElementById('member-table-body');
    tbody.innerHTML = '';
    members.forEach((m, i) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${i + 1}</td>
            <td><input type="text" value="${m.part}" oninput="updateMember(${i}, 'part', this.value)"></td>
            <td><input type="text" value="${m.name}" oninput="updateMember(${i}, 'name', this.value)"></td>
            <td><input type="text" value="${m.icon}" oninput="updateMember(${i}, 'icon', this.value)" style="font-size:10px;"></td>
        `;
        tbody.appendChild(row);
    });
}

function filterJinkeiOptions() {
    const count = members.filter(m => m.selected).length;
    const select = document.getElementById('jinkei-type');
    const currentVal = select.value;
    select.innerHTML = '';
    let firstValidKey = '';
    for (const key in FORMATION_TYPES) {
        const f = FORMATION_TYPES[key];
        if (count >= f.minMembers) {
            const opt = document.createElement('option');
            opt.value = key; opt.innerText = `${f.name}`;
            select.appendChild(opt);
            if (!firstValidKey) firstValidKey = key;
        }
    }
    if (Array.from(select.options).some(o => o.value === currentVal)) { select.value = currentVal; }
    else if (firstValidKey) { select.value = firstValidKey; }
}

function updatePreview() {
    const container = document.getElementById('members-container');
    const liveBanner = document.getElementById('live-banner');
    const speechBubble = document.getElementById('speech-bubble');
    const bubbleText = document.getElementById('bubble-text');
    const speakerIdx = parseInt(document.getElementById('speaker-select').value);
    
    // 入力値の取得
    const venue = document.getElementById('input-venue').value || "会場名・日時";
    const liveTitle = document.getElementById('input-live-title').value || "ライブのタイトル";
    const jinkeiType = document.getElementById('jinkei-type').value;
    
    // テキスト反映
    liveBanner.innerText = venue;
    bubbleText.innerText = liveTitle;

    // 表示切り替えロジック
    const isSpeakerActive = (speakerIdx >= 0 && members[speakerIdx] && members[speakerIdx].selected);
    speechBubble.classList.toggle('active', isSpeakerActive);
    // 会場バナーは常に表示（テキストがある場合）
    liveBanner.style.display = (venue.trim() !== "") ? 'block' : 'none';

    // 背景画像の更新（確実に表示させる）
    const bgImg = document.getElementById('battle-bg');
    const selectedBg = document.getElementById('bg-select').value;
    if (bgImg.src.split('/').pop() !== selectedBg) {
        bgImg.src = selectedBg;
    }

    // メンバー配置（選択済みのみ）
    container.innerHTML = '';
    if (!jinkeiType || !FORMATION_TYPES[jinkeiType]) return;
    
    const selectedMembers = members.filter(m => m.selected);
    const baseCoords = FORMATION_TYPES[jinkeiType].coords;
    const overrides = userOverrides[jinkeiType] || {};

    selectedMembers.forEach((m, i) => {
        if (i >= baseCoords.length) return;
        const defaultCoord = baseCoords[i];
        const coord = overrides[i] || defaultCoord;

        // 吹き出しの位置調整 (担当者の場合)
        const realIdx = members.indexOf(m);
        if (realIdx === speakerIdx) {
            speechBubble.style.left = `${coord.x - 65}px`;
            speechBubble.style.top = `${coord.y - 125}px`;
        }

        const iconEl = document.createElement('div');
        iconEl.className = 'member-icon';
        iconEl.style.left = `${coord.x - 65}px`;
        iconEl.style.top = `${coord.y - 65}px`;
        iconEl.dataset.index = i;

        iconEl.innerHTML = `<img src="${m.icon}" onerror="this.style.display='none'"><div class="member-name">${m.part} ${m.name}</div>`;
        
        // ドラッグ用イベント
        iconEl.onmousedown = (e) => startDrag(e, i, iconEl, realIdx);
        iconEl.ontouchstart = (e) => startDrag(e, i, iconEl, realIdx);

        container.appendChild(iconEl);
    });
}

// ドラッグ＆ドロップ中核
let dragRealIdx = null;
function startDrag(e, idx, el, realIdx) {
    isDragging = true;
    dragElement = el;
    dragMemberIdx = idx;
    dragRealIdx = realIdx;
    el.classList.add('dragging');
    e.preventDefault();
}

function onDragMove(e) {
    if (!isDragging) return;
    const preview = document.getElementById('preview-area');
    const rect = preview.getBoundingClientRect();
    const clientX = (e.type && e.type.includes('touch')) ? e.touches[0].clientX : e.clientX;
    const clientY = (e.type && e.type.includes('touch')) ? e.touches[0].clientY : e.clientY;
    
    // スケール（拡大率）を取得
    const scale = rect.width / 800;
    
    let x = (clientX - rect.left) / scale;
    let y = (clientY - rect.top) / scale;

    // 範囲制限
    x = Math.max(50, Math.min(x, 750));
    y = Math.max(50, Math.min(y, 400));

    dragElement.style.left = `${x - 65}px`;
    dragElement.style.top = `${y - 65}px`;

    // 吹き出しの追従
    const speakerIdx = parseInt(document.getElementById('speaker-select').value);
    if (dragRealIdx === speakerIdx) {
        const speechBubble = document.getElementById('speech-bubble');
        speechBubble.style.left = `${x - 65}px`;
        speechBubble.style.top = `${y - 125}px`;
    }
}

function onDragEnd() {
    if (!isDragging) return;
    const jinkeiType = document.getElementById('jinkei-type').value;
    if (!userOverrides[jinkeiType]) userOverrides[jinkeiType] = {};
    
    userOverrides[jinkeiType][dragMemberIdx] = {
        x: parseInt(dragElement.style.left) + 65,
        y: parseInt(dragElement.style.top) + 65
    };

    dragElement.classList.remove('dragging');
    isDragging = false;
    dragElement = null;
    dragMemberIdx = null;
    saveData();
}

// ユーティリティ
function resetJinkeiPositions() {
    const jinkeiType = document.getElementById('jinkei-type').value;
    if (confirm("現在の陣形の配置を初期化しますか？")) {
        delete userOverrides[jinkeiType];
        saveData();
        updatePreview();
    }
}

function openModal(id) { document.getElementById(id).classList.add('active'); }
function closeModal(id) { document.getElementById(id).classList.remove('active'); }

function toggleMember(index) {
    members[index].selected = !members[index].selected;
    saveData();
    renderMemberToggles();
    renderSpeakerSelect();
    filterJinkeiOptions();
    updatePreview();
}

function updateMember(index, field, value) {
    members[index][field] = value;
    saveData();
    renderMemberToggles();
    renderSpeakerSelect();
    updatePreview();
}

async function exportImage() {
    const btn = document.querySelector('.export-btn');
    const originalText = btn.innerText;
    btn.innerText = "生成中..."; btn.disabled = true;

    try {
        // スケールを一時的に1に戻してキャプチャする（画質維持のため）
        const scaler = document.getElementById('preview-scaler');
        const wrapper = document.querySelector('.preview-wrapper');
        const oldTransform = scaler.style.transform;
        const oldWrapperHeight = wrapper.style.height;
        
        scaler.style.transform = "none";
        wrapper.style.height = "450px";

        const canvas = await html2canvas(document.querySelector("#preview-area"), { 
            scale: 2, 
            useCORS: true,
            backgroundColor: "#000"
        });

        // 元に戻す
        applyScaling();

        const imgData = canvas.toDataURL("image/png");
        const dest = document.getElementById('generated-image-dest');
        dest.innerHTML = `<img src="${imgData}" alt="Generated Jinkei">`;
        
        // PCなら自動ダウンロードも試みる
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        if (!isMobile) {
            const link = document.createElement('a');
            link.download = `band_jinkei_${Date.now()}.png`;
            link.href = imgData;
            link.click();
        }

        openModal('image-modal');
    } catch (err) {
        console.error(err);
        alert("画像の生成に失敗しました。ブラウザの設定や通信環境を確認してください。");
    } finally {
        btn.innerText = originalText; btn.disabled = false;
    }
}

function applyScaling() {
    const wrapper = document.querySelector('.preview-wrapper');
    const scaler = document.getElementById('preview-scaler');
    if (!wrapper || !scaler) return;
    
    const containerWidth = wrapper.offsetWidth;
    const scale = Math.min(1, containerWidth / 800);
    
    scaler.style.transform = `scale(${scale})`;
    wrapper.style.height = `${450 * scale}px`;
}

window.onload = () => {
    loadData();
    renderMemberToggles();
    renderSpeakerSelect();
    renderMemberRows();
    filterJinkeiOptions();
    updatePreview();
    
    document.getElementById('input-venue').addEventListener('input', () => { saveData(); updatePreview(); });
    document.getElementById('input-live-title').addEventListener('input', () => { saveData(); updatePreview(); });
    document.getElementById('bg-select').addEventListener('change', () => { saveData(); updatePreview(); });
    document.getElementById('jinkei-type').addEventListener('change', () => { saveData(); updatePreview(); });
    document.getElementById('speaker-select').addEventListener('change', () => { saveData(); updatePreview(); });

    window.addEventListener('resize', applyScaling);
    applyScaling();

    document.addEventListener('mousemove', onDragMove);
    document.addEventListener('mouseup', onDragEnd);
    document.addEventListener('touchmove', onDragMove);
    document.addEventListener('touchend', onDragEnd, { passive: false });

    window.onclick = (e) => {
        if (e.target.classList.contains('modal-overlay')) closeModal(e.target.id);
    };
};
