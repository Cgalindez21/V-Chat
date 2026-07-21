// =======================================================
// 1. CONFIGURACIÓN Y VARIABLES GLOBALES
// =======================================================
const SUPABASE_URL = "https://qyqoljyigbalykdxghmb.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF5cW9sanlpZ2JhbHlrZHhnaG1iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4NjAxOTUsImV4cCI6MjA5NDQzNjE5NX0.0rTstAx0PdzUABUKkaHBdjYno7iJDmAI-A0VN-iLT9Y";
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const TELEGRAM_BOT_TOKEN = "8999311143:AAG10u35kwR-xQd2KSGnq9zfL48UozVO5o8";

let currentUser = null;
let activeChatId = null;
let isRegistering = false;
let globalContacts = [];
let lastInteractionTime = 0;
let notifiedMessageIds = [];
let isRecording = false;
let mediaRecorder = null;
let audioChunks = [];
let recordTimer = null;
let selectedLocalSongFile = null;

let failedLoginAttempts = 0;

// Variables para OTP de Telegram, Recuperación y Autorización de Dispositivos Nuevos
let generatedRecoveryCode = null;
let currentUserRecovery = null;
let pendingDeviceUser = null;
let pendingDeviceOtp = null;

let commentStartX = 0;
let commentCurrentX = 0;

window.addEventListener('touchstart', () => { lastInteractionTime = Date.now(); }, { passive: true });
window.addEventListener('click', () => { lastInteractionTime = Date.now(); }, { passive: true });
window.addEventListener('keydown', () => { lastInteractionTime = Date.now(); }, { passive: true });

document.addEventListener('visibilitychange', async () => {
    if (!currentUser) return;
    const status = document.visibilityState === 'visible' ? 'online' : 'offline';
    try {
        await _supabase.from('users').update({ status: status }).eq('id', currentUser.id);
    } catch (e) {
        console.warn("Fallo al actualizar presencia en visibilidad:", e);
    }
});

window.addEventListener('beforeunload', () => {
    if (currentUser) {
        localStorage.removeItem(`vchat_device_id_${currentUser.id}`);
        const url = `${SUPABASE_URL}/rest/v1/users?id=eq.${currentUser.id}`;
        const payload = JSON.stringify({ status: 'offline' });
        const headers = {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Content-Type': 'application/json'
        };
        fetch(url, {
            method: 'PATCH',
            headers: headers,
            body: payload,
            keepalive: true
        });
    }
});

const EMOJI_DATA = {
    "Sonrisas y personas": ['😀','😃','😄','😁','😆','😅','🤣','😂','🙂','🙃','😉','😊','😇','🥰','😍','🤩','😘','😗','☺️','😚','😙','🥲','😋','😛','😜','🤪','😝','🤑','🤗','🤭','🫢','🫣','🤫','🤔','🫡','🤐','🤨','😐','😑','😶','😏','😒','🙄','😬','😌','😔','😪','🤤','😴','😷','👍','👎','👏','🙌','🫶','🙏','💪'],
    "Animales y naturaleza": ['🐵','🐶','🐺','🦊','🦝','🐱','🦁','🐯','🐴','🦄','ZEBRA','🐷','🐹','🐰','🐻','🐼','🐨','🐸','🐙','🐒','🐟','🐠','🐡','🦈','🦋','💮','🌹','🥀','🌺','🌻','🌼','🌷','🌱','🪴','🌲','🌳','🌴','🌵','🍀'],
    "Comida y bebida": ['🍇','🍉','🍊','🍋','🍌','🍍','🍎','🍏','🍒','🍓','🍔','🍟','🍕','🌭','🥪','🌮','🌯','🍳','🥘','🍲','🍣','🧁','🍩','🍪','🍫','🍬','🍭','🍯','🥛','☕','🍵','🍺','🍻','🥂','🥤','🧋','🧃'],
    "Actividades": ['🎃','🎄','🎆','🎇','🧨','✨','🎈','🎉','🎊','🎁','🏆','🏅','🥇','⚽','⚾','🥎','🏀','🏈','🎾','🎱','🎯','🎮','🕹️','🎰','🎲','🧩','🧸','♠️','♥️','♦️','♣️','♟️','🎨','🎭','🎬'],
    "Viajes y lugares": ['🌍','🌎','🌐','🗺️','🧭','🏔️','🌋','🗻','🏖️','🏜️','🏝️','🏞️','🏠','🏡','🏢','🏫','🏯','🏰','⛪','⛩️','🕋','⛲','⛺','🏙️','🌄','🌅','🌆','🌇','🌉','🎡','🎢','🚂','🚌','🚗','🚘','🚙','🚚','🏎️','🏍️','🛵','🚲','⛽','🚨','🚥','🚦','🛑','🚧','⚓','🛟','⛵','🛶','🚤','🛳️','🚢','✈️','🚀','🛸','⌛','⏳','⌚','⏰','🌡️','☀️','🪐','⭐','🌟','🌠','🌌','☁️','⚡','❄️','☃️','🔥','💧','🌊'],
    "Objetos": ['👓','🕶️','🥽','👔','👕','👖','🧣','🧤','🧥','🧦','👗','🩱','👙','👛','👜','🎒','👞','👟','👠','👑','🎩','🎓','⛑️','📿','💄','💎','📢','📣','🔔','🎼','🎵','🎶','🎙️','🎤','🎧','📱','📲','💻','🖥️','🖨️','⌨️','🖱️','🎞️','📽️','📺','📷','📸','📹','📼','📔','📕','📖','📗','📘','📙','📚','📓','📒','📃','📜','📄','📰','💰','🪙','💴','💵','💸','💳','🧾','✉️','📧','📦','🗳️','✏️','📝','💼','📁','📂','📅','📆','🗒️','🗓️','📌','📍','📎','📏','📐','✂️','🗑️','🔒','🔓','🔑','🗝️','🔨','⛏️','⚒️','🛠️','🔬','📡','💉','🩸','💊','🩹','🩺','🚪','🛗','🪞','🪟','🛋️','🪑','toilet','🚿','🛁','🧹','🧺','🧻','🧼','🧯','🛒','🚬','🪦'],
    "Símbolos": ['🏧','🚮','🚰','♿','🚹','🚺','🚻','🚼','🚾','⚠️','🚸','⛔','🚫','🚳','🚭','🚯','🚱','🚷','📵','🔞','☢️','☣️','🎦','⚛️','🕉️','✡️','☸️','☯️','✝️','☦️','☪️','☮️']
};

// =======================================================
// ENVIAR MENSAJES DE NOTIFICACIÓN A TELEGRAM
// =======================================================
async function sendTelegramMessage(telegramChatId, text) {
    if (!telegramChatId || !TELEGRAM_BOT_TOKEN) return;
    try {
        const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
        await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: telegramChatId,
                text: text,
                parse_mode: 'HTML'
            })
        });
    } catch (err) {
        console.warn("Fallo al enviar notificación de Telegram:", err);
    }
}

async function notifyUserViaTelegram(userId, text) {
    try {
        const { data: user, error } = await _supabase
            .from('users')
            .select('status, telegram_chat_id')
            .eq('id', userId)
            .single();
            
        if (error || !user) return;
        
        if (user.status === 'online') {
            return;
        }
        
        if (user.telegram_chat_id) {
            await sendTelegramMessage(user.telegram_chat_id, text);
        }
    } catch (err) {
        console.warn("Fallo al verificar presencia para Telegram:", err);
    }
}

// =======================================================
// CRIPTOGRAFÍA: CIFRADO SIMÉTRICO DE EXTREMO A EXTREMO (E2EE) AES-256
// =======================================================
function getChatSymmetricKey(id1, id2) {
    const sortedIds = [id1, id2].sort().join('_');
    return CryptoJS.SHA256(sortedIds).toString();
}

function encryptMessage(plainText, id1, id2) {
    try {
        const key = getChatSymmetricKey(id1, id2);
        return "ENC:" + CryptoJS.AES.encrypt(plainText, key).toString();
    } catch (e) {
        return plainText;
    }
}

function decryptMessage(encryptedText, id1, id2) {
    if (!encryptedText || !encryptedText.startsWith("ENC:")) return encryptedText;
    try {
        const cleanCipher = encryptedText.substring(4);
        const key = getChatSymmetricKey(id1, id2);
        const bytes = CryptoJS.AES.decrypt(cleanCipher, key);
        return bytes.toString(CryptoJS.enc.Utf8);
    } catch (e) {
        return "[Error al descifrar mensaje]";
    }
}

// =======================================================
// 2. BOTONES DE NAVEGACIÓN Y PANELES (ÁMBITO INTERNO APP)
// =======================================================
function initNavigation() {
    document.getElementById('status-btn').onclick = () => window.showFeedView();
    document.getElementById('mobile-feed-back-btn').onclick = () => window.showSidebarView();
    
    document.getElementById('requests-btn').onclick = () => togglePanel('requests-panel', true);
    document.getElementById('settings-btn').onclick = () => togglePanel('settings-panel', true);
    document.getElementById('add-contact-btn').onclick = () => document.getElementById('contact-modal').classList.remove('hidden');

    document.getElementById('back-requests').onclick = () => togglePanel('requests-panel', false);
    document.getElementById('back-settings').onclick = () => togglePanel('settings-panel', false);
    document.getElementById('back-private').onclick = () => togglePanel('private-panel', false);

    document.getElementById('close-modal').onclick = () => {
        document.getElementById('contact-modal').classList.add('hidden');
        document.getElementById('modal-error').innerText = "";
    };
    document.getElementById('close-status-modal').onclick = () => {
        document.getElementById('create-status-modal').classList.add('hidden');
        selectedLocalSongFile = null;
    };
    document.getElementById('close-changelog-modal').onclick = () => document.getElementById('changelog-modal').classList.add('hidden');

    document.getElementById('close-premium-modal').onclick = () => {
        document.getElementById('premium-modal').classList.add('hidden');
    };

    const upgradeBtn = document.getElementById('upgrade-premium-btn');
    if (upgradeBtn) {
        upgradeBtn.onclick = () => {
            const modal = document.getElementById('premium-modal');
            if (modal) modal.classList.remove('hidden');
        };
    }

    const changelogTrigger = document.getElementById('changelog-status-trigger');
    if (changelogTrigger) {
        changelogTrigger.onclick = () => {
            const modal = document.getElementById('changelog-modal');
            if (modal) modal.classList.remove('hidden');
        };
    }

    document.getElementById('mobile-back-btn').onclick = (e) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        window.showSidebarView();
    };

    document.getElementById('logout-btn').onclick = async () => {
        if (currentUser) {
            try {
                localStorage.removeItem(`vchat_device_id_${currentUser.id}`);
                await _supabase.from('users').update({ status: 'offline' }).eq('id', currentUser.id);
            } catch (e) {
                console.warn(e);
            }
        }
        await _supabase.auth.signOut();
        location.reload();
    };
}

function togglePanel(id, show) {
    const p = document.getElementById(id);
    if (p) show ? p.classList.remove('hidden-panel') : p.classList.add('hidden-panel');
}

// =======================================================
// 3. EMOJIS
// =======================================================
function initEmojiBars() {
    const chatBar = document.getElementById('emoji-bar-chat');
    const statusBar = document.getElementById('emoji-bar-status');
    const quickEmojis = ['😀', '😂', '😍', '👍', '❤️', '🔥', '🚀', '😢', '😮', '😡'];
    
    const makeBarHtml = (targetInputId) => {
        let html = quickEmojis.map(emo => `
            <span onclick="window.insertEmoji('${emo}', '${targetInputId}')" style="cursor:pointer; font-size:20px; user-select:none; transition:transform 0.2s;" onmouseover="this.style.transform='scale(1.2)'" onmouseout="this.style.transform='scale(1)'">${emo}</span>
        `).join('');
        html += `<span onclick="window.openEmojiPicker('${targetInputId}', false)" style="cursor:pointer; font-size:18px; color:var(--vchat-green); font-weight:bold; display:flex; align-items:center; gap:4px; user-select:none; padding-left:8px;" title="Ver todos los emojis"><i class="far fa-smile"></i> ➕</span>`;
        return html;
    };
    
    if (chatBar) chatBar.innerHTML = makeBarHtml('messageInput');
    if (statusBar) statusBar.innerHTML = makeBarHtml('status-text');
}

window.insertEmoji = (emoji, targetId) => {
    const input = document.getElementById(targetId);
    if (!input) return;
    const start = input.selectionStart;
    const end = input.selectionEnd;
    const val = input.value;
    input.value = val.substring(0, start) + emoji + val.substring(end);
    input.focus();
    const newPos = start + emoji.length;
    input.setSelectionRange(newPos, newPos);
};

function updateActiveChatStatus() {
    try {
        if (!activeChatId || !globalContacts || !currentUser) return;
        const foundRelation = globalContacts.find(c => {
            if (!c) return false;
            const contact = c.sender_id === currentUser.id ? c.receiver : c.sender;
            return contact && contact.id === activeChatId;
        });
        
        const statusSpan = document.querySelector('.status-online');
        if (statusSpan) {
            if (foundRelation) {
                const contact = foundRelation.sender_id === currentUser.id ? foundRelation.receiver : foundRelation.sender;
                const isOnline = contact && window.onlineUsersList && window.onlineUsersList.includes(contact.id);
                
                statusSpan.style.color = isOnline ? 'var(--vchat-green)' : 'var(--text-sec)';
                statusSpan.innerHTML = `<i class="fas fa-circle" style="font-size: 8px;"></i> ${isOnline ? 'en línea' : 'offline'}`;
            } else {
                statusSpan.style.color = 'var(--text-sec)';
                statusSpan.innerHTML = `<i class="fas fa-circle" style="font-size: 8px;"></i> offline`;
            }
        }
    } catch (err) {
        console.error("Error en updateActiveChatStatus:", err);
    }
}

window.openEmojiPicker = (targetId, isReaction = false) => {
    const existing = document.getElementById('global-emoji-picker');
    if (existing) existing.remove();
    
    const modal = document.createElement('div');
    modal.id = 'global-emoji-picker';
    modal.className = 'emoji-picker-modal';
    
    let contentHtml = '';
    for (const [category, emojis] of Object.entries(EMOJI_DATA)) {
        contentHtml += `
            <div style="grid-column: span 8; padding: 12px 4px 4px 4px; border-bottom: 1px solid var(--border-light); color: var(--vchat-green); font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; margin-top:8px;">
                ${category}
            </div>
        `;
        contentHtml += emojis.map(emo => {
            if (isReaction) {
                return `<span class="emoji-item" onclick="window.toggleReaction('${targetId}', '${emo}', false); document.getElementById('global-emoji-picker').remove();" style="cursor:pointer; font-size:24px; user-select:none;">${emo}</span>`;
            } else {
                return `<span class="emoji-item" onclick="window.insertEmoji('${emo}', '${targetId}'); document.getElementById('global-emoji-picker').remove();" style="cursor:pointer; font-size:24px; user-select:none;">${emo}</span>`;
            }
        }).join('');
    }
    
    modal.innerHTML = `
        <div class="emoji-picker" style="animation: fadeInUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);">
            <div class="emoji-picker-header">
                <h4 style="font-size:16px; font-weight:bold;"><i class="far fa-smile"></i> Selector de Emojis</h4>
                <button onclick="document.getElementById('global-emoji-picker').remove()" style="background:none; border:none; color:var(--text-sec); cursor:pointer; font-size:18px;"><i class="fas fa-times"></i></button>
            </div>
            <div class="emoji-picker-content" style="max-height: 40vh; overflow-y: auto;">
                ${contentHtml}
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
};

// =======================================================
// 4. AUTENTICACIÓN Y SEGURIDAD CON 2FA TELEGRAM PARA DISPOSITIVOS NUEVOS
// =======================================================
const authForm = document.getElementById('auth-form');
const toggleLink = document.getElementById('toggle-link');

toggleLink.onclick = () => {
    isRegistering = !isRegistering;
    document.getElementById('auth-title').innerText = isRegistering ? "Crear Cuenta" : "V-Chat";
    document.getElementById('login-identifier').placeholder = isRegistering ? "Nombre de Usuario" : "Usuario o ID V-Chat";
    document.getElementById('reg-name-group').style.display = isRegistering ? "flex" : "none";
    document.getElementById('register-recovery-fields').style.display = isRegistering ? "flex" : "none";
    document.getElementById('auth-btn').innerText = isRegistering ? "Registrarse" : "Iniciar Sesión";
    toggleLink.innerText = isRegistering ? "¿Ya tienes cuenta? Inicia Sesión" : "Crear una cuenta nueva";
};

const loginIdInput = document.getElementById('login-identifier');
const userStatusLabel = document.getElementById('username-availability-status');

let debounceTimer = null;
if (loginIdInput) {
    loginIdInput.oninput = () => {
        if (!isRegistering) {
            if (userStatusLabel) userStatusLabel.style.display = 'none';
            return;
        }
        
        clearTimeout(debounceTimer);
        const val = loginIdInput.value.trim().toLowerCase();
        if (val.length < 3) {
            if (userStatusLabel) userStatusLabel.style.display = 'none';
            return;
        }
        
        debounceTimer = setTimeout(async () => {
            const { data, error } = await _supabase
                .from('users')
                .select('username')
                .eq('username', val)
                .maybeSingle();
                
            if (userStatusLabel) {
                userStatusLabel.style.display = 'block';
                if (data) {
                    const suggestion = `${val}${Math.floor(100 + Math.random() * 899)}`;
                    userStatusLabel.style.color = '#ff3b30';
                    userStatusLabel.innerHTML = `<i class="fas fa-times-circle"></i> Ocupado. Prueba con: <b style="color:var(--vchat-green); cursor:pointer;" onclick="document.getElementById('login-identifier').value='${suggestion}'; document.getElementById('username-availability-status').style.display='none';">${suggestion}</b>`;
                } else {
                    userStatusLabel.style.color = 'var(--vchat-green)';
                    userStatusLabel.innerHTML = `<i class="fas fa-check-circle"></i> Nombre de usuario disponible`;
                }
            }
        }, 500);
    };
}

function filterContactsUI(searchTerm) {
    const term = searchTerm.toLowerCase();
    const items = document.querySelectorAll('#contactList .contact-item');
    items.forEach(item => {
        const text = item.innerText.toLowerCase();
        if (text.includes(term)) {
            item.style.display = 'flex';
        } else {
            item.style.display = 'none';
        }
    });
}

const searchInput = document.getElementById('search-contacts');
let lastSearchTap = 0;

if (searchInput) {
    const checkPinAndOpenPrivate = () => {
        if (!currentUser) return false;
        const val = searchInput.value.trim();
        const savedPin = localStorage.getItem(`vchat_private_pin_${currentUser.id}`);
        
        if (savedPin && val === savedPin) {
            if (!currentUser.is_premium) {
                showToast("Esta es una función exclusiva de V-Chat Premium VIP.", true);
                return false;
            }
            searchInput.value = '';
            filterContactsUI('');
            loadPrivateContactsList();
            togglePanel('private-panel', true);
            return true;
        }
        return false;
    };

    searchInput.addEventListener('input', () => {
        const val = searchInput.value.trim();
        if (val.length === 4) {
            if (checkPinAndOpenPrivate()) return;
        }
        filterContactsUI(val);
    });

    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const val = searchInput.value.trim();
            if (checkPinAndOpenPrivate()) return;
            
            const savedPin = localStorage.getItem(`vchat_private_pin_${currentUser.id}`);
            if (savedPin && val.length === 4 && val !== savedPin) {
                showToast("PIN de seguridad incorrecto.", true);
            }
        }
    });

    searchInput.onclick = () => {
        const now = Date.now();
        const timespan = now - lastSearchTap;
        
        if (timespan < 350 && timespan > 0) {
            if (!currentUser) return;
            if (!currentUser.is_premium) {
                showToast("Esta es una función exclusiva de V-Chat Premium VIP.", true);
                return;
            }
            
            const savedPin = localStorage.getItem(`vchat_private_pin_${currentUser.id}`);
            if (!savedPin) {
                const newPin = prompt("Configura tu PIN de seguridad privado de 4 dígitos:");
                if (!newPin) return;
                if (newPin.length !== 4 || isNaN(newPin)) {
                    showToast("El PIN debe ser exactamente de 4 dígitos numéricos.", true);
                    return;
                }
                localStorage.setItem(`vchat_private_pin_${currentUser.id}`, newPin);
                showToast("¡PIN privado configurado con éxito!");
            } else {
                const enteredPin = prompt("Ingresa tu PIN de acceso privado:");
                if (enteredPin === savedPin) {
                    loadPrivateContactsList();
                    togglePanel('private-panel', true);
                } else if (enteredPin !== null) {
                    showToast("PIN de seguridad incorrecto.", true);
                }
            }
        }
        lastSearchTap = now;
    };
}

authForm.onsubmit = async (e) => {
    e.preventDefault();
    requestNotificationPermission();
    let iden = document.getElementById('login-identifier').value.trim().toLowerCase();
    const pass = document.getElementById('reg-password').value;

    try {
        if (isRegistering) {
            const email = `${iden}@vchat.app`;
            const name = document.getElementById('reg-name').value;
            const ques = document.getElementById('reg-secret-question').value;
            const ans = document.getElementById('reg-secret-answer').value.trim().toLowerCase();

            const aResult = await _supabase.auth.signUp({ email, password: pass });
            if (aResult.error) throw aResult.error;

            const vId = 'ID-' + Math.floor(10000 + Math.random() * 90000);
            const dbResult = await _supabase.from('users').insert([{
                id: aResult.data.user.id, username: iden, name: name, vchat_id: vId,
                secret_question: ques, secret_answer: ans,
                status: 'offline',
                avatar_url: `https://ui-avatars.com/api/?name=${name}&background=00a884&color=fff`
            }]);
            if (dbResult.error) throw dbResult.error;
            alert("¡Registro exitoso!"); location.reload();
        } else {
            if (iden.startsWith('id-')) {
                const { data: userData, error: userErr = null } = await _supabase
                    .from('users')
                    .select('username')
                    .eq('vchat_id', iden.toUpperCase())
                    .single();
                if (!userErr && userData) {
                    iden = userData.username.toLowerCase();
                }
            }

            const { data: userProfile, error: profileErr } = await _supabase
                .from('users')
                .select('*')
                .eq('username', iden)
                .maybeSingle();

            if (profileErr || !userProfile) {
                showToast("Usuario o contraseña incorrectos. Por favor, verifica tus datos.", true);
                return;
            }

            // AVISO Y BLOQUEO DE SESIÓN DUPICADA EN OTRO DISPOSITIVO
            if (userProfile.status === 'online') {
                const storedDeviceId = localStorage.getItem(`vchat_device_id_${userProfile.id}`);
                if (!storedDeviceId) {
                    showToast("Tienes una sesión activa en otro dispositivo. Te invitamos a cerrar la sesión en el equipo donde la tengas abierta para ingresar aquí.", true);
                    
                    if (userProfile.telegram_chat_id) {
                        await sendTelegramMessage(userProfile.telegram_chat_id, `⚠️ <b>Alerta de Seguridad V-Chat</b>\n\nSe detectó un intento de inicio de sesión desde otro equipo mientras mantienes tu sesión abierta.`);
                    }
                    return;
                }
            }

            const email = `${iden}@vchat.app`;
            const response = await _supabase.auth.signInWithPassword({ email, password: pass });
            if (response.error) throw response.error;

            // RECONOCIMIENTO DE DISPOSITIVO USADO RECIENTEMENTE O NUEVO
            const knownDeviceToken = localStorage.getItem(`vchat_known_device_token_${userProfile.id}`);
            
            if (!knownDeviceToken && userProfile.telegram_chat_id) {
                pendingDeviceUser = response.data.user;
                pendingDeviceOtp = Math.floor(100000 + Math.random() * 900000);
                
                showToast("Verificando dispositivo con Telegram...");
                await sendTelegramMessage(userProfile.telegram_chat_id, `🚨 <b>Alerta de Seguridad V-Chat</b>\n\nSe detectó un intento de inicio de sesión desde un <b>NUEVO DISPOSITIVO</b>.\n\n¿Reconoces este acceso?\n\nTu código de autorización es: <b>${pendingDeviceOtp}</b>\n\nIngresa este código de 6 dígitos en V-Chat para dar permiso e ingresar.`);
                
                document.getElementById('device-auth-modal').classList.remove('hidden');
                document.getElementById('device-otp-code').value = '';
                return;
            } else {
                localStorage.setItem(`vchat_known_device_token_${userProfile.id}`, 'known_' + Date.now());
                showApp(response.data.user);
            }
        }
    } catch (err) { 
        let friendlyMsg = err.message;
        if (err.message.includes("Invalid login credentials") || err.message.includes("does not match") || err.message.includes("invalid_grant")) {
            friendlyMsg = "Usuario o contraseña incorrectos. Por favor, verifica tus datos.";
            
            if (!isRegistering) {
                failedLoginAttempts++;
                if (failedLoginAttempts >= 3) {
                    failedLoginAttempts = 0;
                    showToast("Intentos fallidos excedidos. Redirigiendo a recuperación...", true);
                    setTimeout(() => {
                        document.getElementById('recovery-identifier').value = iden;
                        document.getElementById('recovery-modal').classList.remove('hidden');
                        document.getElementById('btn-recovery-next').click();
                    }, 2000);
                    return;
                }
            }
        }
        showToast(friendlyMsg, true); 
    }
};

// HANDLERS PARA AUTORIZACIÓN DE DISPOSITIVO NUEVO POR TELEGRAM
const btnVerifyDevice = document.getElementById('btn-verify-device-otp');
if (btnVerifyDevice) {
    btnVerifyDevice.onclick = async () => {
        const enteredOtp = document.getElementById('device-otp-code').value.trim();
        if (enteredOtp === String(pendingDeviceOtp)) {
            showToast("Dispositivo autorizado con éxito");
            document.getElementById('device-auth-modal').classList.add('hidden');
            
            if (pendingDeviceUser) {
                localStorage.setItem(`vchat_known_device_token_${pendingDeviceUser.id}`, 'known_' + Date.now());
                const userToLogIn = pendingDeviceUser;
                pendingDeviceUser = null;
                pendingDeviceOtp = null;
                await showApp(userToLogIn);
            }
        } else {
            showToast("Código de autorización de Telegram incorrecto.", true);
        }
    };
}

const btnCancelDevice = document.getElementById('btn-cancel-device-otp');
if (btnCancelDevice) {
    btnCancelDevice.onclick = async () => {
        document.getElementById('device-auth-modal').classList.add('hidden');
        pendingDeviceUser = null;
        pendingDeviceOtp = null;
        await _supabase.auth.signOut();
        showToast("Inicio de sesión cancelado");
    };
}

document.getElementById('forgot-password-link').onclick = () => {
    document.getElementById('recovery-modal').classList.remove('hidden');
};

document.getElementById('btn-recovery-next').onclick = async () => {
    try {
        const iden = document.getElementById('recovery-identifier').value.trim();
        if (!iden) {
            showToast("Por favor, ingresa tu usuario o ID V-Chat", true);
            return;
        }
        
        const response = await _supabase
            .from('users')
            .select('*')
            .or(`username.eq.${iden.toLowerCase()},vchat_id.eq.${iden.toUpperCase()}`)
            .single();
            
        if (response.error || !response.data) {
            showToast("Usuario o ID no registrado en la base de datos.", true);
            return;
        }
        
        currentUserRecovery = response.data; 
        
        document.getElementById('recovery-step-1').classList.add('hidden');
        document.getElementById('recovery-method-select').classList.remove('hidden');
    } catch (err) {
        showToast(`Error de recuperación: ${err.message || err}`, true);
    }
};

document.getElementById('btn-method-question').onclick = () => {
    document.getElementById('recovery-method-select').classList.add('hidden');
    document.getElementById('recovery-question-text').innerText = currentUserRecovery.secret_question;
    document.getElementById('recovery-step-2').classList.remove('hidden');
};

document.getElementById('btn-method-telegram').onclick = async () => {
    if (!currentUserRecovery.telegram_chat_id) {
        showToast("Este usuario no posee un ID de Telegram vinculado en su perfil.", true);
        return;
    }
    
    generatedRecoveryCode = Math.floor(100000 + Math.random() * 900000);
    
    document.getElementById('recovery-method-select').classList.add('hidden');
    document.getElementById('recovery-step-2b').classList.remove('hidden');
    
    showToast("Enviando código de seguridad...");
    await sendTelegramMessage(currentUserRecovery.telegram_chat_id, `🔑 <b>Código de Recuperación V-Chat</b>\n\nTu código temporal de verificación es: <b>${generatedRecoveryCode}</b>\n\nNo reveles este código de seguridad a nadie.`);
};

document.getElementById('btn-recovery-verify').onclick = () => {
    const ans = document.getElementById('recovery-answer').value.trim().toLowerCase();
    if (ans === currentUserRecovery.secret_answer.toLowerCase()) {
        document.getElementById('recovery-step-2').classList.add('hidden');
        document.getElementById('recovery-step-3').classList.remove('hidden');
    } else { showToast("Respuesta incorrecta", true); }
};

document.getElementById('btn-recovery-verify-tg').onclick = () => {
    const codeInput = document.getElementById('recovery-telegram-code').value.trim();
    if (codeInput === String(generatedRecoveryCode)) {
        document.getElementById('recovery-step-2b').classList.add('hidden');
        document.getElementById('recovery-step-3').classList.remove('hidden');
    } else {
        showToast("Código de verificación de Telegram inválido.", true);
    }
};

document.getElementById('btn-recovery-reset').onclick = async () => {
    const newP = document.getElementById('recovery-new-password').value;
    const response = await _supabase.rpc('reset_user_password', { p_user_id: currentUserRecovery.id, p_new_password: newP });
    if (response.error) throw response.error;
    
    showToast("Clave actualizada");
    
    if (currentUserRecovery.telegram_chat_id) {
        await sendTelegramMessage(currentUserRecovery.telegram_chat_id, `🔑 <b>Cambio de Contraseña Exitoso</b>\n\nTu contraseña de V-Chat ha sido actualizada de forma segura en nuestro sistema.`);
    }
    
    location.reload();
};

document.getElementById('close-recovery-modal').onclick = () => {
    document.getElementById('recovery-modal').classList.add('hidden');
    document.getElementById('recovery-step-1').classList.remove('hidden');
    document.getElementById('recovery-method-select').classList.add('hidden');
    document.getElementById('recovery-step-2').classList.add('hidden');
    document.getElementById('recovery-step-2b').classList.add('hidden');
    document.getElementById('recovery-step-3').classList.add('hidden');
    document.getElementById('recovery-identifier').value = '';
    document.getElementById('recovery-answer').value = '';
    document.getElementById('recovery-telegram-code').value = '';
    document.getElementById('recovery-new-password').value = '';
    generatedRecoveryCode = null;
    currentUserRecovery = null;
};

// =======================================================
// 5. CHAT Y MENSAJERÍA (CON CIFRADO DE EXTREMO A EXTREMO E2EE)
// =======================================================
const messageForm = document.getElementById('messageForm');
const messageInput = document.getElementById('messageInput');

messageForm.onsubmit = async (e) => {
    e.preventDefault();
    const text = messageInput.value.trim();
    if (!text || !activeChatId) return;

    const encryptedText = encryptMessage(text, currentUser.id, activeChatId);

    const { error } = await _supabase.from('messages').insert([{
        sender_id: currentUser.id,
        receiver_id: activeChatId,
        text: encryptedText,
        media_type: 'text'
    }]);

    if (error) {
        showToast("Error al enviar", true);
    } else {
        messageInput.value = "";
        loadMessages();
        await notifyUserViaTelegram(activeChatId, `💬 <b>V-Chat</b>\n\nTienes un nuevo mensaje de <b>${currentUser.name}</b>.`);
    }
};

function getTicksHtml(m, isMine) {
    if (!isMine) return '';
    if (m.status === 'read') {
        return `<span class="msg-tick" style="color:#00bfa5; font-size:10px; margin-left:6px;" title="Leído"><i class="fas fa-check-double"></i></span>`;
    } else if (m.status === 'delivered') {
        return `<span class="msg-tick" style="color:#8696a0; font-size:10px; margin-left:6px;" title="Entregado"><i class="fas fa-check-double"></i></span>`;
    } else {
        return `<span class="msg-tick" style="color:#8696a0; font-size:10px; margin-left:6px;" title="Enviado"><i class="fas fa-check"></i></span>`;
    }
}

async function loadMessages() {
    try {
        if (!activeChatId) return;

        const { data: unreadData, error: unreadErr } = await _supabase
            .from('messages')
            .select('id, sender_id')
            .eq('sender_id', activeChatId)
            .eq('receiver_id', currentUser.id)
            .neq('status', 'read');

        if (!unreadErr && unreadData && unreadData.length > 0) {
            unreadData.forEach(m => {
                showSystemNotification(m.sender_id, m.id);
            });
        }

        await _supabase
            .from('messages')
            .update({ status: 'read' })
            .eq('sender_id', activeChatId)
            .eq('receiver_id', currentUser.id)
            .neq('status', 'read');

        const { data, error } = await _supabase
            .from('messages')
            .select('*')
            .or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${activeChatId}),and(sender_id.eq.${activeChatId},receiver_id.eq.${currentUser.id})`)
            .order('created_at', { ascending: true });

        if (error || !data) return;
        
        const container = document.getElementById('messagesContainer');
        if (container) {
            container.innerHTML = data.map(m => {
                const isMine = m.sender_id === currentUser.id;

                let bodyHtml = ``;
                if (m.media_type === 'text') {
                    const decryptedText = decryptMessage(m.text, m.sender_id, m.receiver_id);
                    bodyHtml = `<span class="msg-text" style="word-wrap:break-word;">${decryptedText}</span>`;
                } else if (m.media_type === 'image' && m.media_url) {
                    bodyHtml = `<img src="${m.media_url}" style="max-width:100%; max-height:220px; border-radius:12px; margin-bottom:4px; cursor:pointer;" onclick="window.open('${m.media_url}', '_blank')">`;
                } else if (m.media_type === 'audio' && m.media_url) {
                    bodyHtml = `<audio src="${m.media_url}" controls style="max-width:100%; outline:none; filter:invert(0.1); margin-bottom:4px; height:38px;"></audio>`;
                }

                return `
                    <div id="msg-${m.id}" class="msg ${isMine ? 'sent' : 'received'}" 
                         oncontextmenu="window.handleMessageLongPress(event, '${m.id}', '${m.media_type}', ${isMine})"
                         style="display:flex; flex-direction:column; position:relative; cursor:pointer; user-select:none; -webkit-user-select:none;">
                                ${bodyHtml}
                                <div style="display:flex; align-items:center; justify-content:flex-end; gap:2px; margin-top:4px; align-self:flex-end;">
                                    <small style="font-size:9px; opacity:0.7;">
                                        ${new Date(m.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                    </small>
                                    ${getTicksHtml(m, isMine)}
                                </div>
                            </div>
                        `;
            }).join('');
            container.scrollTop = container.scrollHeight;
        }
    } catch (err) {
        console.error("Error en loadMessages:", err);
    }
}

function appendMessageToUI(m) {
    const container = document.getElementById('messagesContainer');
    if (!container) return;

    const isMine = m.sender_id === currentUser.id;

    let bodyHtml = ``;
    if (m.media_type === 'text') {
        const decryptedText = decryptMessage(m.text, m.sender_id, m.receiver_id);
        bodyHtml = `<span class="msg-text" style="word-wrap:break-word;">${decryptedText}</span>`;
    } else if (m.media_type === 'image' && m.media_url) {
        bodyHtml = `<img src="${m.media_url}" style="max-width:100%; max-height:220px; border-radius:12px; margin-bottom:4px; cursor:pointer;" onclick="window.open('${m.media_url}', '_blank')">`;
    } else if (m.media_type === 'audio' && m.media_url) {
        bodyHtml = `<audio src="${m.media_url}" controls style="max-width:100%; outline:none; filter:invert(0.1); margin-bottom:4px; height:38px;"></audio>`;
    }

    const msgHtml = `
        <div id="msg-${m.id}" class="msg ${isMine ? 'sent' : 'received'}" 
             oncontextmenu="window.handleMessageLongPress(event, '${m.id}', '${m.media_type}', ${isMine})"
             style="display:flex; flex-direction:column; position:relative; cursor:pointer; user-select:none; -webkit-user-select:none;">
            ${bodyHtml}
            <div style="display:flex; align-items:center; justify-content:flex-end; gap:2px; margin-top:4px; align-self:flex-end;">
                <small style="font-size:9px; opacity:0.7;">
                    ${new Date(m.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </small>
                ${getTicksHtml(m, isMine)}
            </div>
        </div>
    `;
    container.insertAdjacentHTML('beforeend', msgHtml);
    container.scrollTop = container.scrollHeight;
}

window.handleMessageLongPress = (event, msgId, mediaType, isMine) => {
    event.preventDefault();
    if (!isMine) return;
    window.showMsgActionSheet(msgId, mediaType);
};

window.showMsgActionSheet = (msgId, mediaType) => {
    const existing = document.getElementById('msg-action-sheet');
    if (existing) existing.remove();

    const isText = mediaType === 'text';

    const sheet = document.createElement('div');
    sheet.id = 'msg-action-sheet';
    sheet.className = 'modal-overlay';
    sheet.style.zIndex = '10006';
    sheet.innerHTML = `
        <div class="modal-card" style="width: 320px; text-align: center; animation: fadeInUp 0.25s cubic-bezier(0.16, 1, 0.3, 1);">
            <h3 style="font-size:16px; margin-bottom:15px; color:var(--text-sec);"><i class="fas fa-tasks"></i> Opciones de Mensaje</h3>
            <div style="display: flex; flex-direction: column; gap: 10px;">
                ${isText ? `<button onclick="window.editMessagePrompt('${msgId}'); document.getElementById('msg-action-sheet').remove();" class="btn-primary" style="width:100%;"><i class="fas fa-edit"></i> Editar Texto</button>` : ''}
                <button onclick="window.deleteSingleMessage('${msgId}'); document.getElementById('msg-action-sheet').remove();" class="btn-primary" style="width:100%; background:#ff3b30; box-shadow:none;"><i class="fas fa-trash-alt"></i> Eliminar Mensaje</button>
                <button onclick="window.document.getElementById('msg-action-sheet').remove();" class="btn-secondary" style="width:100%;"><i class="fas fa-times"></i> Cancelar</button>
            </div>
        </div>
    `;
    document.body.appendChild(sheet);
};

window.deleteSingleMessage = async (id) => {
    if (!confirm("¿Deseas de verdad eliminar permanentemente este mensaje?")) return;
    try {
        const response = await _supabase.from('messages').delete().eq('id', id);
        if (response.error) throw response.error;
        showToast("Mensaje eliminado");
        loadMessages();
    } catch (err) {
        showToast(err.message, true);
    }
};

window.editMessagePrompt = async (id) => {
    const msgDiv = document.getElementById(`msg-${id}`);
    if (!msgDiv) return;
    const textSpan = msgDiv.querySelector('.msg-text');
    if (!textSpan) return;

    const oldText = textSpan.innerText;
    const newText = prompt("Editar mensaje de texto:", oldText);
    if (newText === null || newText.trim() === "" || newText === oldText) return;

    try {
        const encryptedNewText = encryptMessage(newText.trim(), currentUser.id, activeChatId);
        const response = await _supabase
            .from('messages').update({ text: encryptedNewText }).eq('id', id);
        if (response.error) throw response.error;
        showToast("Mensaje editado");
        loadMessages();
    } catch (err) {
        showToast(err.message, true);
    }
};

async function clearActiveChat() {
    if (!activeChatId) return;
    if (!confirm("¿Estás seguro de que deseas vaciar por completo este chat?")) return;

    try {
        const response = await _supabase
            .from('messages').delete().or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${activeChatId}),and(sender_id.eq.${activeChatId},receiver_id.eq.${currentUser.id})`);

        if (response.error) throw response.error;
        showToast("Conversación vaciada");
        loadMessages();
    } catch (err) {
        showToast(err.message, true);
    }
}

_supabase.channel('realtime-messages')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const newMsg = payload.new;
        
        if (currentUser && newMsg.sender_id !== currentUser.id) {
            showSystemNotification(newMsg.sender_id, newMsg.id);
        }

        if (activeChatId && (
            (newMsg.sender_id === currentUser.id && newMsg.receiver_id === activeChatId) ||
            (newMsg.sender_id === activeChatId && newMsg.receiver_id === currentUser.id)
        )) {
            const exists = document.getElementById(`msg-${newMsg.id}`);
            if (!exists) {
                appendMessageToUI(newMsg);
            }
        }
    })
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages' }, (payload) => {
        const updatedMsg = payload.new;
        if (activeChatId && updatedMsg.sender_id === currentUser.id) {
            const msgDiv = document.getElementById(`msg-${updatedMsg.id}`);
            if (msgDiv) {
                const tickSpan = msgDiv.querySelector('.msg-tick');
                if (tickSpan && updatedMsg.status === 'read') {
                    tickSpan.innerHTML = `<i class="fas fa-check-double"></i>`;
                    tickSpan.style.color = '#00bfa5';
                    tickSpan.title = "Leído";
                }
            }
        }
    })
    .subscribe();

function initChatMediaControls() {
    const msgForm = document.querySelector('.msg-form');
    if (msgForm && !document.getElementById('chat-media-wrapper')) {
        const mediaWrapper = document.createElement('div');
        mediaWrapper.id = 'chat-media-wrapper';
        mediaWrapper.style.display = 'flex';
        mediaWrapper.style.gap = '8px';
        mediaWrapper.style.marginRight = '8px';
        
        mediaWrapper.innerHTML = `
            <button type="button" id="chat-image-btn" style="background:var(--input-bg); border:none; color:var(--text-sec); width:38px; height:38px; border-radius:50%; cursor:pointer; display:flex; align-items:center; justify-content:center; font-size:16px; transition:all 0.2s;" onmouseover="this.style.color='var(--vchat-green)'" onmouseout="this.style.color='var(--text-sec)'" title="Enviar Foto">
                <i class="fas fa-camera"></i>
            </button>
            <button type="button" id="chat-voice-btn" style="background:var(--input-bg); border:none; color:var(--text-sec); width:38px; height:38px; border-radius:50%; cursor:pointer; display:flex; align-items:center; justify-content:center; font-size:16px; transition:all 0.2s;" onmouseover="this.style.color='var(--vchat-green)'" onmouseout="this.style.color='var(--text-sec)'" title="Grabar Nota de Voz">
                <i class="fas fa-microphone"></i>
            </button>
            <input type="file" id="chat-image-input" accept="image/*" style="display:none;">
        `;
        
        msgForm.insertBefore(mediaWrapper, document.getElementById('messageInput'));
        
        const imageBtn = mediaWrapper.querySelector('#chat-image-btn');
        const imageInput = mediaWrapper.querySelector('#chat-image-input');
        const voiceBtn = mediaWrapper.querySelector('#chat-voice-btn');

        if (imageBtn && imageInput) {
            imageBtn.onclick = () => imageInput.click();
            imageInput.onchange = async (e) => {
                const file = e.target.files[0];
                if (!file || !activeChatId) return;
                
                try {
                    showToast("Subiendo imagen...");
                    const cleanName = `${Date.now()}_${Math.floor(100 + Math.random() * 900)}.${file.name.split('.').pop()}`;
                    const path = `${currentUser.id}/${cleanName}`;
                    const upResult = await _supabase.storage.from('chat-attachments').upload(path, file);
                    if (upResult.error) throw upResult.error;
                    
                    const fileUrl = _supabase.storage.from('chat-attachments').getPublicUrl(path).data.publicUrl;
                    
                    const insResult = await _supabase.from('messages').insert([{
                        sender_id: currentUser.id,
                        receiver_id: activeChatId,
                        text: "[Imagen]",
                        media_url: fileUrl,
                        media_type: 'image'
                    }]);
                    
                    if (insResult.error) throw insResult.error;
                    loadMessages();
                } catch (err) {
                    showToast(err.message, true);
                }
            };
        }
        
        if (voiceBtn) {
            voiceBtn.onclick = () => toggleVoiceRecording();
        }
    }
}

async function toggleVoiceRecording() {
    const btn = document.getElementById('chat-voice-btn');
    if (!isRecording) {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder = new MediaRecorder(stream);
            audioChunks = [];
            
            mediaRecorder.ondataavailable = (event) => {
                audioChunks.push(event.data);
            };
            
            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
                stream.getTracks().forEach(track => track.stop());
                
                try {
                    showToast("Subiendo nota de voz...");
                    const path = `${currentUser.id}/voice_${Date.now()}.wav`;
                    const upResult = await _supabase.storage.from('chat-attachments').upload(path, audioBlob, { contentType: 'audio/wav' });
                    if (upResult.error) throw upResult.error;
                    
                    const fileUrl = _supabase.storage.from('chat-attachments').getPublicUrl(path).data.publicUrl;
                    
                    const insResult = await _supabase.from('messages').insert([{
                        sender_id: currentUser.id,
                        receiver_id: activeChatId,
                        text: "[Nota de voz]",
                        media_url: fileUrl,
                        media_type: 'audio'
                    }]);
                    
                    if (insResult.error) throw insResult.error;
                    loadMessages();
                } catch (err) {
                    showToast(err.message, true);
                }
            };
            
            mediaRecorder.start();
            isRecording = true;
            btn.style.background = '#ff3b30';
            btn.style.color = 'white';
            btn.innerHTML = `<i class="fas fa-stop"></i>`;
            showToast("Grabando... Máx 2 min");
            
            recordTimer = setTimeout(() => {
                if (isRecording) {
                    toggleVoiceRecording();
                    showToast("Límite de 2 minutos alcanzado");
                }
            }, 120000);
            
        } catch (err) {
            showToast("No se pudo acceder al micrófono", true);
        }
    } else {
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
        }
        isRecording = false;
        clearTimeout(recordTimer);
        btn.style.background = 'var(--input-bg)';
        btn.style.color = 'var(--text-sec)';
        btn.innerHTML = `<i class="fas fa-microphone"></i>`;
    }
}

// =======================================================
// 6. SOLICITUDES DE AMISTAD (CON ENLACES DE TELEGRAM)
// =======================================================
document.getElementById('confirm-add-contact').onclick = async () => {
    const searchVal = document.getElementById('new-contact-id').value.trim();
    const errorLabel = document.getElementById('modal-error');
    errorLabel.innerText = "";
    
    if (!searchVal) return;
    
    try {
        const { data: foundUser, error: sErr = null } = await _supabase
            .from('users')
            .select('*')
            .or(`username.eq.${searchVal.toLowerCase()},vchat_id.eq.${searchVal.toUpperCase()}`)
            .single();
            
        if (sErr || !foundUser) {
            errorLabel.innerText = "Usuario o ID no encontrado.";
            return;
        }
        
        if (foundUser.id === currentUser.id) {
            errorLabel.innerText = "No puedes agregarte a ti mismo.";
            return;
        }
        
        const { data: insData, error: insErr } = await _supabase
            .from('contacts')
            .insert([{
                sender_id: currentUser.id,
                receiver_id: foundUser.id,
                status: 'pending'
            }]).select().single();
            
        if (insErr) {
            errorLabel.innerText = "Ya tienes una solicitud pendiente o relación.";
            return;
        }
        
        showToast("Solicitud enviada exitosamente");
        document.getElementById('contact-modal').classList.add('hidden');
        document.getElementById('new-contact-id').value = "";
        
        const appUrl = window.location.origin + window.location.pathname;
        const tgText = `👥 <b>Solicitud de Amistad</b>\n\n¡Has recibido una solicitud de amistad de <b>${currentUser.name}</b>!\n\n` +
                       `👉 <a href="${appUrl}?accept_req=${insData.id}">Aceptar Solicitud</a>\n` +
                       `👉 <a href="${appUrl}?reject_req=${insData.id}">Rechazar Solicitud</a>`;
        await notifyUserViaTelegram(foundUser.id, tgText);
    } catch (err) {
        errorLabel.innerText = err.message;
    }
};

async function loadIncomingRequests() {
    const { data, error } = await _supabase
        .from('contacts')
        .select('id, sender_id, users!contacts_sender_id_fkey(name, avatar_url)')
        .eq('receiver_id', currentUser.id)
        .eq('status', 'pending');
        
    if (error) return;
    
    const container = document.getElementById('requests-list-container');
    const badge = document.getElementById('requests-badge');
    
    if (data.length > 0) {
        badge.innerText = data.length;
        badge.classList.remove('hidden');
    } else {
        badge.classList.add('hidden');
    }
    
    if (data.length === 0) {
        container.innerHTML = `<p style="text-align:center; color:var(--text-sec); font-size:13px; margin-top:20px;">No tienes solicitudes pendientes.</p>`;
        return;
    }
    
    container.innerHTML = data.map(r => {
        const sender = r.users;
        return `
            <div class="request-item" style="display:flex; align-items:center; justify-content:space-between; padding:12px; background:var(--chat-bg); border-radius:12px; margin-bottom:8px; border:1px solid var(--border-light);">
                <div style="display:flex; align-items:center; gap:10px;">
                    <img src="${sender.avatar_url}" class="avatar-sm">
                    <strong style="font-size:14px; color:var(--text-main);">${sender.name}</strong>
                </div>
                <div style="display:flex; gap:6px;">
                    <button onclick="window.respondRequest('${r.id}', 'accepted')" style="background:var(--vchat-green); border:none; color:white; padding:6px 12px; border-radius:8px; font-size:12px; cursor:pointer; font-weight:bold;">Aceptar</button>
                    <button onclick="window.respondRequest('${r.id}', 'rejected')" style="background:#ff3b30; border:none; color:white; padding:6px 12px; border-radius:8px; font-size:12px; cursor:pointer; font-weight:bold;">Rechazar</button>
                </div>
            </div>
        `;
    }).join('');
}

window.respondRequest = async (requestId, newStatus) => {
    try {
        if (newStatus === 'rejected') {
            const response = await _supabase
                .from('contacts')
                .delete()
                .eq('id', requestId);
            if (response.error) throw response.error;
            showToast("Solicitud de amistad rechazada");
        } else {
            const response = await _supabase
                .from('contacts')
                .update({ status: 'accepted' })
                .eq('id', requestId);
            if (response.error) throw response.error;
            showToast("Solicitud de amistad aceptada");
        }
        loadIncomingRequests();
        window.lastContactsSignature = "";
        loadContacts();
    } catch (err) {
        showToast(err.message, true);
    }
};

_supabase.channel('realtime-contacts')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'contacts' }, () => {
        loadIncomingRequests();
        window.lastContactsSignature = "";
        loadContacts();
    }).subscribe();

// =======================================================
// 7. HISTORIAS / PUBLICACIONES (V-MOMENTS)
// =======================================================
document.getElementById('create-status-btn').onclick = () => document.getElementById('create-status-modal').classList.remove('hidden');

async function getVideoDuration(file) {
    return new Promise((resolve) => {
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.onloadedmetadata = () => {
            window.URL.revokeObjectURL(video.src);
            resolve(video.duration);
        };
        video.src = URL.createObjectURL(file);
    });
}

document.getElementById('submit-status-btn').onclick = async () => {
    const file = document.getElementById('status-image').files[0];
    const text = document.getElementById('status-text').value;
    let fileUrl = null;
    let fileType = 'text';

    try {
        if (selectedLocalSongFile) {
            showToast("Subiendo canción vinculada...");
            const cleanName = `music_${Date.now()}_${Math.floor(100 + Math.random() * 900)}.${selectedLocalSongFile.name.split('.').pop()}`;
            const path = `${currentUser.id}/${cleanName}`;
            const upResult = await _supabase.storage.from('status-images').upload(path, selectedLocalSongFile);
            if (upResult.error) throw upResult.error;
            fileUrl = _supabase.storage.from('status-images').getPublicUrl(path).data.publicUrl;
            fileType = 'audio';
        }
        else if (file) {
            if (file.type.includes('video')) {
                const duration = await getVideoDuration(file);
                const maxVideoSeconds = currentUser.is_premium ? 600 : 180;
                if (duration > maxVideoSeconds) {
                    showToast(`El video excede el límite de tu plan (${currentUser.is_premium ? '10 min' : '3 min'}).`, true);
                    return;
                }
                fileType = 'video';
            } else {
                fileType = 'image';
            }

            showToast("Subiendo archivo multimedia...");
            const cleanName = `${Date.now()}_${Math.floor(100 + Math.random() * 900)}.${file.name.split('.').pop()}`;
            const path = `${currentUser.id}/${cleanName}`;
            const upResult = await _supabase.storage.from('status-images').upload(path, file);
            if (upResult.error) throw upResult.error;
            fileUrl = _supabase.storage.from('status-images').getPublicUrl(path).data.publicUrl;
        }

        const insResult = await _supabase.from('statuses').insert([{
            user_id: currentUser.id, user_name: currentUser.name,
            user_avatar: currentUser.avatar_url, text, file_url: fileUrl, file_type: fileType
        }]);
        if (insResult.error) throw insResult.error;

        showToast("Historia publicada con éxito"); 
        document.getElementById('create-status-modal').classList.add('hidden');
        document.getElementById('status-text').value = '';
        document.getElementById('status-image').value = '';
        selectedLocalSongFile = null;
        loadStatuses();

        globalContacts.forEach(async (c) => {
            const partner = c.sender_id === currentUser.id ? c.receiver : c.sender;
            if (partner) {
                await notifyUserViaTelegram(partner.id, `✨ <b>V-Moments</b>\n\n¡<b>${currentUser.name}</b> acaba de publicar un nuevo V-Moment!`);
            }
        });

    } catch (err) { showToast(err.message, true); }
};

async function autoPurgeStories(statuses) {
    const now = new Date();
    const expired = statuses.filter(s => {
        const createdDate = new Date(s.created_at);
        const diffHours = Math.abs(now - createdDate) / (1000 * 60 * 60);
        return diffHours >= 24;
    });

    for (let s of expired) {
        try {
            await _supabase.from('status_comments').delete().eq('status_id', s.id);
            await _supabase.from('status_reactions').delete().eq('status_id', s.id);
            await _supabase.from('statuses').delete().eq('id', s.id);
            if (s.file_url) {
                const fileName = s.file_url.split('/status-images/')[1];
                if (fileName) {
                    await _supabase.storage.from('status-images').remove([fileName]);
                }
            }
        } catch (e) {
            console.error("Fallo al purgar historia:", e);
        }
    }
}

async function loadStatuses() {
    const { data: statuses, error: sErr } = await _supabase
        .from('statuses')
        .select('*')
        .order('created_at', { ascending: false });

    if (sErr || !statuses) return;
    await autoPurgeStories(statuses);

    const activeStatuses = statuses.filter(s => {
        const diffHours = Math.abs(new Date() - new Date(s.created_at)) / (1000 * 60 * 60);
        return diffHours < 24;
    });

    const statusIds = activeStatuses.map(s => s.id);
    let comments = [];
    let reactions = [];

    if (statusIds.length > 0) {
        const { data: cData } = await _supabase
            .from('status_comments')
            .select('*')
            .in('status_id', statusIds)
            .order('created_at', { ascending: true });
        if (cData) comments = cData;

        const { data: rData } = await _supabase
            .from('status_reactions')
            .select('*')
            .in('status_id', statusIds);
        if (rData) reactions = rData;
    }

    const container = document.getElementById('status-list-container');
    container.innerHTML = activeStatuses.map(s => {
        const isMine = s.user_id === currentUser.id;
        const sComments = comments.filter(c => c.status_id === s.id);
        const sReactions = reactions.filter(r => r.status_id === s.id);

        const reactionCounts = sReactions.reduce((acc, curr) => {
            acc[curr.emoji] = (acc[curr.emoji] || 0) + 1;
            return acc;
        }, {});

        const myReaction = sReactions.find(r => r.user_id === currentUser.id)?.emoji;

        let mediaHtml = '';
        if (s.file_url) {
            if (s.file_type === 'video') {
                mediaHtml = `<video src="${s.file_url}" controls style="max-width:100%; border-radius:12px; margin-top:8px; outline:none; max-height: 340px; width: 100%; background: #000;"></video>`;
            } else if (s.file_type === 'audio') {
                mediaHtml = `
                    <div style="background: rgba(0, 191, 165, 0.08); border: 1px solid var(--vchat-green); padding: 14px; border-radius: 12px; margin-top: 8px; display: flex; flex-direction: column; gap: 8px;">
                        <span style="font-size: 13.5px; color: var(--text-main); font-weight: bold; display: flex; align-items: center; gap: 8px;">
                            <i class="fas fa-music" style="color: var(--vchat-green);"></i> Canción recomendada
                        </span>
                        <audio src="${s.file_url}" controls style="width: 100%; outline: none; filter: invert(0.08);"></audio>
                    </div>
                `;
            } else {
                mediaHtml = `<img src="${s.file_url}" style="max-width:100%; max-height:340px; border-radius:12px; margin-top:8px; object-fit: cover; width: 100%;" alt="Multimedia">`;
            }
        }

        const emojis = ['👍', '❤️', '😂', '😮', '😢'];
        let reactionOptionsHtml = emojis.map(emo => {
            const isSelected = myReaction === emo;
            const activeStyle = isSelected ? 'background: rgba(0, 191, 165, 0.25); border-radius: 8px;' : '';
            return `<span onclick="window.toggleReaction('${s.id}', '${emo}', ${isSelected})" style="cursor:pointer; font-size:18px; padding:4px 8px; transition:transform 0.2s; display:inline-block; ${activeStyle}" onmouseover="this.style.transform='scale(1.2)'" onmouseout="this.style.transform='scale(1)'">${emo}</span>`;
        }).join('');

        reactionOptionsHtml += `<span onclick="window.openEmojiPicker('${s.id}', true)" style="cursor:pointer; font-size:15px; color:var(--vchat-green); font-weight:bold; display:inline-block; padding:4px 8px; user-select:none;" title="Reaccionar con cualquier emoji">➕</span>`;

        const reactionsSummary = Object.entries(reactionCounts).map(([emo, count]) => {
            return `<span style="font-size:12px; background: rgba(255,255,255,0.04); padding:4px 8px; border-radius:12px; margin-right:4px; border:1px solid var(--border-light);">${emo} ${count}</span>`;
        }).join('');

        const commentsHtml = sComments.map(c => {
            const isCommentMine = c.user_id === currentUser.id;
            const hasHeart = c.text.endsWith(" ❤️");
            const cleanText = hasHeart ? c.text.substring(0, c.text.length - 2) : c.text;

            const formattedText = cleanText.replace(/@([A-Za-z0-9_À-ÿ]+(?:\s+[A-Za-z0-9_À-ÿ]+)?)/g, '<span class="mention-tag">@$1</span>');
            
            return `
                <div class="comment-wrapper" id="comment-wrapper-${c.id}">
                    <div class="comment-swipe-actions">
                        <span class="comment-action-btn react-heart" onclick="window.toggleCommentHeart('${c.id}', '${c.text.replace(/'/g, "\\'")}', ${hasHeart})" title="Me gusta">
                            <i class="${hasHeart ? 'fas' : 'far'} fa-heart"></i>
                        </span>
                        <span class="comment-action-btn reply-comment" onclick="window.replyToComment('${s.id}', '${c.user_name}')" title="Responder">
                            <i class="fas fa-reply"></i>
                        </span>
                    </div>
                    <div class="comment-item" id="comment-item-${c.id}" 
                         ontouchstart="window.handleCommentTouchStart(event, '${c.id}')"
                         ontouchmove="window.handleCommentTouchMove(event, '${c.id}')"
                         ontouchend="window.handleCommentTouchEnd(event, '${c.id}')"
                         onclick="window.toggleCommentSwipe('${c.id}')"
                         style="font-size: 12.5px; background: #1f2c34 !important; padding: 8px 12px; border-radius: 10px; border-left:2px solid var(--vchat-green); display: flex; justify-content: space-between; align-items: center; user-select:none; -webkit-user-select:none;">
                        <div>
                            <strong style="color: var(--vchat-green); display: inline-flex; align-items: center; gap: 4px;">${c.user_name}:</strong>
                            <span style="color: var(--text-main); word-wrap: break-word;">${formattedText}</span>
                            ${hasHeart ? `<span style="margin-left: 6px; color: #ff3b30; font-size:11px;">❤️</span>` : ''}
                        </div>
                        ${isCommentMine ? `
                            <div style="display:flex; gap:8px; z-index: 3;" onclick="event.stopPropagation()">
                                <i class="fas fa-edit" onclick="window.editComment('${c.id}', '${c.text}')" style="cursor:pointer; color:var(--text-sec); font-size:11px;"></i>
                                <i class="fas fa-trash" onclick="window.deleteComment('${c.id}')" style="cursor:pointer; color:#ff3b30; font-size:11px;"></i>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');

        const inputId = `comment-input-${s.id}`;

        return `
            <div class="status-card" style="margin-bottom: 16px; padding: 16px; background: var(--hover-bg); border-radius: 16px; border: 1px solid var(--border-light); position: relative;">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <img src="${s.user_avatar || 'https://ui-avatars.com/api/?name=' + s.user_name}" class="avatar-sm">
                        <div>
                            <strong style="font-size: 14px; color: var(--text-main); display: inline-flex; align-items: center; gap: 5px;">${s.user_name}</strong>
                            <p style="font-size: 10px; color: var(--text-sec);">${new Date(s.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                        </div>
                    </div>
                    ${isMine ? `
                        <div style="display:flex; gap:10px;">
                            <button onclick="window.editStatusPrompt('${s.id}', '${s.text.replace(/'/g, "\\'")}')" style="background:none; border:none; color:var(--text-sec); cursor:pointer; font-size:14px;"><i class="fas fa-edit"></i></button>
                            <button onclick="window.deleteStatus('${s.id}')" style="background:none; border:none; color:#ff3b30; cursor:pointer; font-size:14px;"><i class="fas fa-trash-alt"></i></button>
                        </div>
                    ` : ''}
                </div>

                ${s.text ? `<p style="font-size: 13.5px; color: var(--text-main); line-height:1.4; word-wrap:break-word;">${s.text}</p>` : ''}
                ${mediaHtml}

                <div style="height: 1px; background: var(--border-light); margin: 12px 0 8px 0;"></div>

                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <div style="display: flex; gap: 4px; align-items: center; flex-wrap: wrap;">
                        ${reactionOptionsHtml}
                    </div>
                    <div style="display: flex; gap: 4px;">
                        ${reactionsSummary}
                    </div>
                </div>

                <div style="margin-top: 10px;">
                    ${commentsHtml}
                </div>

                <div style="display: flex; gap: 8px; margin-top: 12px; align-items: center;">
                    <input type="text" id="${inputId}" placeholder="Escribe un comentario..." style="flex:1; padding:8px 12px; background:var(--input-bg); border:1px solid transparent; border-radius:12px; color:var(--text-main); font-size:12.5px; outline:none;" onkeypress="if(event.key === 'Enter') window.commentOnStatus('${s.id}', '${inputId}')">
                    <button onclick="window.openEmojiPicker('${inputId}', false)" style="background:var(--input-bg); border:none; color:var(--text-sec); width:32px; height:32px; border-radius:50%; cursor:pointer; display:flex; align-items:center; justify-content:center; font-size:16px;" title="Insertar Emoji">
                        <i class="far fa-smile"></i>
                    </button>
                    <button onclick="window.commentOnStatus('${s.id}', '${inputId}')" style="background:var(--vchat-green); border:none; width:32px; height:32px; border-radius:50%; color:white; cursor:pointer; display:flex; align-items:center; justify-content:center; font-size:12px; transition:transform 0.2s;" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
                        <i class="fas fa-paper-plane"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

window.handleCommentTouchStart = (e, commentId) => {
    commentStartX = e.touches[0].clientX;
    commentCurrentX = commentStartX;
};

window.handleCommentTouchMove = (e, commentId) => {
    commentCurrentX = e.touches[0].clientX;
    const diffX = commentStartX - commentCurrentX;
    const item = document.getElementById(`comment-item-${commentId}`);
    if (item) {
        if (diffX > 0 && diffX < 120) {
            item.style.transform = `translateX(-${diffX}px)`;
        }
    }
};

window.handleCommentTouchEnd = (e, commentId) => {
    const diffX = commentStartX - commentCurrentX;
    const item = document.getElementById(`comment-item-${commentId}`);
    if (item) {
        item.style.transition = "transform 0.2s ease";
        if (diffX > 45) {
            item.classList.add('swiped-left');
            item.style.transform = "translateX(-90px)";
        } else {
            item.classList.remove('swiped-left');
            item.style.transform = "translateX(0px)";
        }
        setTimeout(() => { item.style.transition = ""; }, 200);
    }
};

window.toggleCommentSwipe = (commentId) => {
    const item = document.getElementById(`comment-item-${commentId}`);
    if (item) {
        item.style.transition = "transform 0.2s ease";
        if (item.classList.contains('swiped-left')) {
            item.classList.remove('swiped-left');
            item.style.transform = "translateX(0px)";
        } else {
            document.querySelectorAll('.comment-item.swiped-left').forEach(el => {
                el.classList.remove('swiped-left');
                el.style.transform = "translateX(0px)";
            });
            item.classList.add('swiped-left');
            item.style.transform = "translateX(-90px)";
        }
        setTimeout(() => { item.style.transition = ""; }, 200);
    }
};

window.replyToComment = (statusId, username) => {
    const input = document.getElementById(`comment-input-${statusId}`);
    if (input) {
        input.value = `@${username} `;
        input.focus();
        document.querySelectorAll('.comment-item.swiped-left').forEach(el => {
            el.classList.remove('swiped-left');
            el.style.transform = "translateX(0px)";
        });
    }
};

window.toggleCommentHeart = async (commentId, currentText, hasHeart) => {
    let newText = currentText;
    if (hasHeart) {
        if (currentText.endsWith(" ❤️")) {
            newText = currentText.substring(0, currentText.length - 2);
        }
    } else {
        newText = `${currentText} ❤️`;
    }

    try {
        const response = await _supabase
            .from('status_comments')
            .update({ text: newText })
            .eq('id', commentId);
        if (response.error) throw response.error;
        loadStatuses();
    } catch (err) {
        console.error(err);
        showToast("Error al reaccionar al comentario.", true);
    }
};

window.toggleReaction = async (statusId, emoji, isSelected) => {
    try {
        if (isSelected) {
            const response = await _supabase
                .from('status_reactions')
                .delete()
                .eq('status_id', statusId)
                .eq('user_id', currentUser.id);
            if (response.error) throw response.error;
        } else {
            const response = await _supabase.from('status_reactions').upsert({
                status_id: statusId,
                user_id: currentUser.id,
                emoji: emoji
            }, { onConflict: 'status_id,user_id' });
            if (response.error) throw response.error;

            try {
                const { data: storyOwner } = await _supabase.from('statuses').select('user_id').eq('id', statusId).single();
                if (storyOwner && storyOwner.user_id !== currentUser.id) {
                    await notifyUserViaTelegram(storyOwner.user_id, `❤️ <b>V-Moments</b>\n\nTu historia ha recibido una nueva reacción.`);
                }
            } catch (tgErr) {
                console.warn(tgErr);
            }
        }
        loadStatuses();
    } catch (err) { showToast(err.message, true); }
};

window.deleteStatus = async (id) => {
    if (!confirm("¿Deseas de verdad eliminar permanentemente esta historia?")) return;
    try {
        await _supabase.from('status_comments').delete().eq('status_id', id);
        await _supabase.from('status_reactions').delete().eq('status_id', id);
        
        const response = await _supabase.from('statuses').delete().eq('id', id);
        if (response.error) throw response.error;
        
        showToast("Historia eliminada");
        loadStatuses();
    } catch (err) { showToast(err.message, true); }
};

window.editStatusPrompt = async (id, oldText) => {
    const newText = prompt("Editar texto de tu Historia:", oldText);
    if (newText === null || newText.trim() === "" || newText === oldText) return;
    try {
        const response = await _supabase
            .from('statuses').update({ text: newText.trim() }).eq('id', id);
        if (response.error) throw response.error;
        showToast("Historia actualizada");
        loadStatuses();
    } catch (err) { showToast(err.message, true); }
};

window.editComment = async (commentId, oldCommentText) => {
    const newText = prompt("Editar tu comentario:", oldCommentText);
    if (newText === null || newText.trim() === "" || newText === oldCommentText) return;
    try {
        const response = await _supabase
            .from('status_comments').update({ text: newText.trim() }).eq('id', commentId);
        if (response.error) throw response.error;
        showToast("Comentario modificado");
        loadStatuses();
    } catch (err) { showToast(err.message, true); }
};

window.deleteComment = async (commentId) => {
    if (!confirm("¿Deseas eliminar este comentario?")) return;
    try {
        const response = await _supabase
            .from('status_comments').delete().eq('id', commentId);
        if (response.error) throw response.error;
        showToast("Comentario eliminado");
        loadStatuses();
    } catch (err) {
        showToast(err.message, true);
    }
};

window.commentOnStatus = async (statusId, inputId) => {
    const textInput = document.getElementById(inputId);
    const text = textInput.value.trim();
    if (!text) return;
    try {
        const response = await _supabase.from('status_comments').insert([{
            status_id: statusId,
            user_id: currentUser.id,
            user_name: currentUser.name,
            text: text
        }]);
        if (response.error) throw response.error;
        textInput.value = '';
        loadStatuses();

        try {
            const { data: storyOwner } = await _supabase.from('statuses').select('user_id').eq('id', statusId).single();
            if (storyOwner && storyOwner.user_id !== currentUser.id) {
                await notifyUserViaTelegram(storyOwner.user_id, `💬 <b>V-Moments</b>\n\nTu historia ha recibido un nuevo comentario.`);
            }
        } catch (tgErr) {
            console.warn(tgErr);
        }

    } catch (err) { showToast(err.message, true); }
};

window.contactAdminSupport = async () => {
    try {
        const { data: admin, error } = await _supabase
            .from('users')
            .select('*')
            .eq('username', 'cgalindez21')
            .single();
            
        if (error || !admin) {
            showToast("Soporte no disponible temporalmente.", true);
            return;
        }
        
        window.startChat(admin.id, admin.name, admin.avatar_url);
    } catch (e) {
        console.warn("Fallo al conectar con soporte:", e);
    }
};

window.deleteContact = async (contactId, name) => {
    if (!confirm(`¿Estás seguro de eliminar a ${name}?`)) return;
    try {
        const response = await _supabase
            .from('contacts')
            .delete()
            .or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${contactId}),and(sender_id.eq.${contactId},receiver_id.eq.${currentUser.id})`);
            
        if (response.error) throw response.error;
        showToast("Contacto eliminado");
        window.lastContactsSignature = "";
        loadContacts();
    } catch (err) {
        console.error("Fallo al eliminar contacto:", err);
    }
};

// =======================================================
// 8. ENLACES DEL PERFIL
// =======================================================
document.getElementById('edit-avatar-file').onchange = async (e) => {
    const file = e.target.files[0];
    if (!file || !currentUser) return;
    
    try {
        const cleanName = `avatar_${Date.now()}_${Math.floor(100 + Math.random() * 900)}.${file.name.split('.').pop()}`;
        const path = `${currentUser.id}/${cleanName}`;
        const upResult = await _supabase.storage.from('avatars').upload(path, file);
        if (upResult.error) throw upResult.error;
        
        const fileUrl = _supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl;
        
        const response = await _supabase
            .from('users').update({ avatar_url: fileUrl }).eq('id', currentUser.id);
            
        if (response.error) throw response.error;
        
        currentUser.avatar_url = fileUrl;
        document.getElementById('my-avatar').src = fileUrl;
        document.getElementById('settings-avatar').src = fileUrl;
        document.getElementById('my-status-avatar').src = fileUrl;
        
        showToast("Foto de perfil actualizada");
    } catch (err) {
        showToast(err.message, true);
    }
};

document.getElementById('edit-name').onchange = async (e) => {
    const newName = e.target.value.trim();
    if (!newName || !currentUser) return;
    
    try {
        const response = await _supabase
            .from('users').update({ name: newName }).eq('id', currentUser.id);
            
        if (response.error) throw response.error;
        currentUser.name = newName;
        showToast("Nombre actualizado");
    } catch (err) {
        showToast(err.message, true);
    }
};

document.getElementById('edit-custom-status').onchange = async (e) => {
    const newStatus = e.target.value.trim();
    if (!currentUser) return;
    
    try {
        const response = await _supabase
            .from('users').update({ custom_status: newStatus }).eq('id', currentUser.id);
            
        if (response.error) throw response.error;
        showToast("Presentación actualizada");
    } catch (err) {
        showToast(err.message, true);
    }
};

const listenInput = document.getElementById('edit-listening-to');
if (listenInput) {
    listenInput.onchange = async (e) => {
        const songName = e.target.value.trim();
        if (!currentUser) return;
        try {
            const response = await _supabase
                .from('users').update({ listening_to: songName }).eq('id', currentUser.id);
            if (response.error) throw response.error;
            currentUser.listening_to = songName;
            showToast("Música actual actualizada");
            window.lastContactsSignature = "";
            loadContacts();
        } catch (err) {
            console.error(err);
        }
    };
}

const profileMusicInput = document.getElementById('profile-music-file');
if (profileMusicInput) {
    profileMusicInput.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        let cleanedSongName = file.name.replace(/\.[^/.]+$/, "");
        cleanedSongName = cleanedSongName.replace(/_/g, " ").replace(/-/g, " - ");

        if (document.getElementById('edit-listening-to')) {
            document.getElementById('edit-listening-to').value = cleanedSongName;
        }

        try {
            await _supabase.from('users').update({ listening_to: cleanedSongName }).eq('id', currentUser.id);
            currentUser.listening_to = cleanedSongName;
            showToast("Música actualizada");
            window.lastContactsSignature = "";
            loadContacts();

            if (confirm(`¿Deseas compartir "${cleanedSongName}" también en tus historias?`)) {
                selectedLocalSongFile = file;
                document.getElementById('create-status-modal').classList.remove('hidden');
                document.getElementById('status-text').value = `🎵 Escuchando: ${cleanedSongName}`;
            }
        } catch (err) {
            console.warn("Fallo al actualizar música de perfil:", err);
        }
    };
}

const localMusicInput = document.getElementById('status-music-file');
if (localMusicInput) {
    localMusicInput.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        let cleanedSongName = file.name.replace(/\.[^/.]+$/, ""); 
        cleanedSongName = cleanedSongName.replace(/_/g, " ").replace(/-/g, " - "); 

        document.getElementById('status-text').value = `🎵 Escuchando: ${cleanedSongName}`;
        selectedLocalSongFile = file;

        if (currentUser) {
            try {
                await _supabase.from('users').update({ listening_to: cleanedSongName }).eq('id', currentUser.id);
                currentUser.listening_to = cleanedSongName;
                if (document.getElementById('edit-listening-to')) {
                    document.getElementById('edit-listening-to').value = cleanedSongName;
                }
                window.lastContactsSignature = "";
                loadContacts();
            } catch (err) {
                console.warn("Fallo al sincronizar música local:", err);
            }
        }
        showToast("Canción vinculada");
    };
}

const tgInput = document.getElementById('edit-telegram-id');
if (tgInput) {
    tgInput.onchange = async (e) => {
        const telegramId = e.target.value.trim();
        if (!currentUser) return;
        try {
            const response = await _supabase
                .from('users').update({ telegram_chat_id: telegramId }).eq('id', currentUser.id);
            if (response.error) throw response.error;
            currentUser.telegram_chat_id = telegramId;
            showToast("ID de Telegram guardado");
        } catch (err) {
            showToast("Error al guardar ID de Telegram", true);
        }
    };
}

const testTgBtn = document.getElementById('test-telegram-btn');
if (testTgBtn) {
    testTgBtn.onclick = async () => {
        const telegramId = document.getElementById('edit-telegram-id').value.trim();
        const statusLabel = document.getElementById('telegram-test-status');
        
        if (!telegramId) {
            showToast("Por favor, ingresa un ID numérico de Telegram.", true);
            return;
        }
        
        statusLabel.style.display = 'block';
        statusLabel.style.color = 'var(--text-sec)';
        statusLabel.innerHTML = `<i class="fas fa-spinner fa-spin" style="color: var(--vchat-green);"></i> Probando conexión con el bot de Telegram...`;
        
        try {
            const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: telegramId,
                    text: `📡 <b>Prueba de Conexión de V-Chat</b>\n\n¡Felicidades! La sincronización de notificaciones entre tu cuenta de V-Chat y tu Telegram está completamente activa y funcionando de forma segura.`,
                    parse_mode: 'HTML'
                })
            });
            
            const resData = await res.json();
            
            if (resData.ok) {
                statusLabel.style.color = 'var(--vchat-green)';
                statusLabel.innerHTML = `<i class="fas fa-check-circle" style="color: var(--vchat-green);"></i> ¡Prueba exitosa! Revisa de inmediato tu chat de Telegram.`;
                showToast("Mensaje de prueba enviado");
            } else {
                throw new Error(resData.description || "ID no válido o bot no iniciado");
            }
        } catch (err) {
            statusLabel.style.color = '#ff3b30';
            statusLabel.innerHTML = `<i class="fas fa-times-circle" style="color: #ff3b30;"></i> Fallo de conexión: ${err.message}. Asegúrate de haber iniciado al bot <a href="https://t.me/vchat_notifications_bot" target="_blank" style="color:#ff3b30; text-decoration:underline;">@vchat_notifications_bot</a> primero.`;
            showToast("Error de prueba", true);
        }
    };
}

// INTEGRACIÓN: Función dinámica para alternar privacidad (Ocultar/Desocultar Contactos)
window.toggleContactPrivacy = (contactId, name) => {
    if (!currentUser.is_premium) {
        showToast("Esta es una función exclusiva de V-Chat Premium VIP.", true);
        return;
    }
    
    const savedPin = localStorage.getItem(`vchat_private_pin_${currentUser.id}`);
    if (!savedPin) {
        const newPin = prompt("Para usar esta función, primero debes configurar tu PIN de seguridad de 4 dígitos:");
        if (!newPin) return;
        if (newPin.length !== 4 || isNaN(newPin)) {
            showToast("El PIN debe ser exactamente de 4 dígitos numéricos.", true);
            return;
        }
        localStorage.setItem(`vchat_private_pin_${currentUser.id}`, newPin);
        showToast("¡PIN de seguridad configurado con éxito!");
    }
    
    const privateListStr = localStorage.getItem(`vchat_private_list_${currentUser.id}`) || '[]';
    let privateList = JSON.parse(privateListStr);
    
    if (privateList.includes(contactId)) {
        privateList = privateList.filter(id => id !== contactId);
        showToast(`${name} ahora se muestra en la lista pública`);
    } else {
        privateList.push(contactId);
        showToast(`${name} ha sido ocultado en V-Privados con éxito`);
    }
    
    localStorage.setItem(`vchat_private_list_${currentUser.id}`, JSON.stringify(privateList));
    
    window.lastContactsSignature = "";
    loadContacts();
    loadPrivateContactsList();
};

// Generar lista de contactos privados ocultos en el panel secreto de seguridad
function loadPrivateContactsList() {
    const listContainer = document.getElementById('private-contacts-list');
    if (!listContainer || !currentUser) return;
    
    const privateListStr = localStorage.getItem(`vchat_private_list_${currentUser.id}`) || '[]';
    const privateList = JSON.parse(privateListStr);
    
    if (privateList.length === 0) {
        listContainer.innerHTML = `<p style="text-align:center; color:var(--text-sec); font-size:12.5px; margin-top:20px;">No tienes ningún contacto privado oculto.</p>`;
        return;
    }
    
    const privateContacts = globalContacts.map(c => {
        const contact = c.sender_id === currentUser.id ? c.receiver : c.sender;
        if (contact && privateList.includes(contact.id)) return contact;
        return null;
    }).filter(Boolean);
    
    listContainer.innerHTML = privateContacts.map(contact => {
        return `
            <div id="private-item-${contact.id}" class="contact-item" style="display:flex; align-items:center; justify-content:space-between; gap:15px; padding:12px; background:var(--chat-bg); border-radius:12px; border:1px solid rgba(0, 191, 165, 0.2);" >
                <div style="display:flex; align-items:center; gap:12px; cursor:pointer; flex:1;" onclick="window.startChat('${contact.id}', '${contact.name.replace(/'/g, "\\'")}', '${contact.avatar_url}'); document.getElementById('back-private').click();">
                    <img src="${contact.avatar_url}" class="avatar-sm">
                    <div>
                        <strong style="font-size:14.5px; color:var(--text-main);">${contact.name}</strong>
                        <p style="font-size:11px; color:var(--vchat-green); margin-top:2px;">Toca para abrir chat</p>
                    </div>
                </div>
                <button onclick="window.toggleContactPrivacy('${contact.id}', '${contact.name.replace(/'/g, "\\'")}')" style="background: rgba(0, 191, 165, 0.15); border: 1px solid var(--vchat-green); color: var(--vchat-green); padding: 8px 12px; border-radius: 8px; font-size: 12px; font-weight: bold; cursor: pointer; display: flex; align-items: center; gap: 6px; flex-shrink: 0;" title="Devolver a lista pública">
                    <i class="fas fa-eye"></i> Desocultar
                </button>
            </div>
        `;
    }).join('');
}

function updatePremiumUI() {
    if (!currentUser) return;
    const planLabel = document.getElementById('settings-plan-label');
    const adContainer = document.getElementById('adsterra-banner-container');
    const upgradeBtn = document.getElementById('upgrade-premium-btn');
    
    if (currentUser.is_premium) {
        if (adContainer) adContainer.classList.add('hidden');
        if (planLabel) planLabel.innerHTML = `<span class="vip-crown"><i class="fas fa-crown"></i> V-Chat Premium</span>`;
        if (upgradeBtn) upgradeBtn.classList.add('hidden');
    } else {
        if (adContainer) adContainer.classList.remove('hidden');
        if (planLabel) planLabel.innerHTML = `Plan Gratis`;
        if (upgradeBtn) upgradeBtn.classList.remove('hidden');
    }
}

document.getElementById('copy-id-btn').onclick = () => {
    const idText = document.getElementById('settings-id').innerText;
    navigator.clipboard.writeText(idText);
    showToast("ID copiado al portapapeles");
};

// =======================================================
// 9. CONTROL DE MULTIMEDIA ACTIVA
// =======================================================
function isMediaPlaying() {
    const audios = document.querySelectorAll('audio');
    const videos = document.querySelectorAll('video');
    for (let a of audios) {
        if (!a.paused && !a.ended && a.currentTime > 0) return true;
    }
    for (let v of videos) {
        if (!v.paused && !v.ended && v.currentTime > 0) return true;
    }
    return false;
}

// =======================================================
// 10. GESTIÓN DE VISTAS
// =======================================================
window.showSidebarView = () => {
    activeChatId = null;
    document.getElementById('mainWindow').className = 'main-window';
};

window.showFeedView = () => {
    activeChatId = null;
    
    document.getElementById('chat-navbar').classList.add('hidden');
    document.getElementById('messagesContainer').classList.add('hidden');
    document.getElementById('chat-footer').classList.add('hidden');
    
    document.getElementById('feed-view').classList.remove('hidden');
    document.getElementById('mainWindow').className = 'main-window view-feed';
};

window.showChatView = () => {
    document.getElementById('feed-view').classList.add('hidden');
    
    document.getElementById('chat-navbar').classList.remove('hidden');
    document.getElementById('messagesContainer').classList.remove('hidden');
    document.getElementById('chat-footer').classList.remove('hidden');
    
    document.getElementById('mainWindow').className = 'main-window view-chat';
};

async function handleUrlActions() {
    const urlParams = new URLSearchParams(window.location.search);
    const acceptId = urlParams.get('accept_req');
    const rejectId = urlParams.get('reject_req');
    if (acceptId) {
        const { error } = await _supabase.from('contacts').update({ status: 'accepted' }).eq('id', acceptId);
        if (!error) {
            showToast("Solicitud de amistad aceptada");
            window.history.replaceState({}, document.title, window.location.pathname);
            window.lastContactsSignature = "";
            loadContacts();
        }
    } else if (rejectId) {
        const { error } = await _supabase.from('contacts').delete().eq('id', rejectId);
        if (!error) {
            showToast("Solicitud de amistad rechazada");
            window.history.replaceState({}, document.title, window.location.pathname);
            window.lastContactsSignature = "";
            loadContacts();
        }
    }
}

// =======================================================
// 11. INICIALIZACIÓN DE LA APP Y BLOQUEO DE SESIÓN DUPILCADA
// =======================================================
async function showApp(user) {
    try {
        const { data: profile, error } = await _supabase.from('users').select('*').eq('id', user.id).single();
        
        if (error || !profile) {
            showToast("Error de acceso: Perfil no encontrado.", true);
            return;
        }
        
        let localDeviceId = localStorage.getItem(`vchat_device_id_${user.id}`);
        
        if (profile.status === 'online' && !localDeviceId) {
            showToast("Tienes una sesión activa en otro dispositivo. Te invitamos a cerrar la sesión en el equipo donde la tengas abierta para ingresar aquí.", true);
            await _supabase.auth.signOut();
            return;
        }
        
        if (!localDeviceId) {
            localDeviceId = 'device_' + Date.now() + '_' + Math.floor(Math.random() * 100000);
            localStorage.setItem(`vchat_device_id_${user.id}`, localDeviceId);
        }
        
        currentUser = profile;
        document.getElementById('auth-screen').classList.add('hidden');
        document.getElementById('app-container').classList.remove('hidden');
        
        requestNotificationPermission();
        
        try {
            await _supabase.from('users').update({ status: 'online' }).eq('id', user.id);
        } catch (statusErr) {
            console.warn(statusErr);
        }
        
        document.getElementById('my-avatar').src = profile.avatar_url;
        document.getElementById('settings-avatar').src = profile.avatar_url;
        document.getElementById('my-status-avatar').src = profile.avatar_url;
        document.getElementById('settings-id').innerText = profile.vchat_id;
        document.getElementById('edit-name').value = profile.name;
        document.getElementById('edit-custom-status').value = profile.custom_status || '¡Hola! Estoy usando V-Chat';
        if (document.getElementById('edit-telegram-id')) {
            document.getElementById('edit-telegram-id').value = profile.telegram_chat_id || '';
        }
        if (document.getElementById('edit-listening-to')) {
            document.getElementById('edit-listening-to').value = profile.listening_to || '';
        }

        const waBtn = document.getElementById('support-whatsapp-btn');
        if (waBtn) {
            waBtn.href = `https://wa.me/584121235648?text=Hola%20Carlos!%20Adjunto%20mi%20comprobante%20de%20Pago%20Móvil%20para%20activar%20mi%20cuenta%20Premium%20en%20V-Chat.%20Mi%20ID%20de%20usuario%20es:%20${profile.vchat_id}`;
        }

        updatePremiumUI();

        initNavigation();
        initEmojiBars();
        window.lastContactsSignature = "";
        loadContacts();
        loadIncomingRequests();
        loadStatuses();
        initChatMediaControls();
        
        loadSafeAd();
        
        await handleUrlActions();
        
        window.showFeedView();

        const presenceChannel = _supabase.channel('presence-vchat', {
            config: { presence: { key: currentUser.id } }
        });
        
        window.onlineUsersList = [];
        
        presenceChannel
            .on('presence', { event: 'sync' }, () => {
                const state = presenceChannel.presenceState();
                window.onlineUsersList = Object.keys(state);
                window.lastContactsSignature = ""; 
                loadContacts();
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    try {
                        await presenceChannel.track({ online_at: new Date().toISOString() });
                    } catch (trackErr) {
                        console.warn(trackErr);
                    }
                }
            });

        _supabase.channel(`realtime-my-profile-${currentUser.id}`)
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'users', filter: `id=eq.${currentUser.id}` }, (payload) => {
                currentUser = payload.new;
                updatePremiumUI();
                window.lastContactsSignature = "";
                loadContacts();
                loadStatuses();
            })
            .subscribe();

        _supabase.channel('realtime-statuses-feed')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'statuses' }, () => { loadStatuses(); })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'status_comments' }, () => { loadStatuses(); })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'status_reactions' }, () => { loadStatuses(); })
            .subscribe();

        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('sw.js')
                    .then(reg => {
                        console.log('Service Worker registrado:', reg.scope);
                    })
                    .catch(err => {
                        console.warn('Fallo al registrar Service Worker:', err);
                    });
            });
        }
    } catch (globalAppErr) {
        console.error("Excepción en la inicialización de la app:", globalAppErr);
        showToast("Error de inicialización.", true);
    }
}

async function loadContacts() {
    try {
        const { data: contactsData, error: contactsErr = null } = await _supabase
            .from('contacts')
            .select(`
                id,
                sender_id,
                receiver_id,
                sender:users!contacts_sender_id_fkey(*),
                receiver:users!contacts_receiver_id_fkey(*)
            `)
            .eq('status', 'accepted')
            .or(`sender_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`);
            
        if (contactsErr) return;

        const { data: msgData, error: msgErr } = await _supabase
            .from('messages')
            .select('sender_id, receiver_id')
            .or(`sender_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`);
            
        let nonContactUsers = [];
        if (!msgErr && msgData) {
            const activeUserIds = new Set();
            msgData.forEach(m => {
                if (m.sender_id !== currentUser.id) activeUserIds.add(m.sender_id);
                if (m.receiver_id !== currentUser.id) activeUserIds.add(m.receiver_id);
            });
            
            const contactIds = new Set();
            contactsData.forEach(c => {
                const contact = c.sender_id === currentUser.id ? c.receiver : c.sender;
                if (contact) contactIds.add(contact.id);
            });
            
            const missingIds = [...activeUserIds].filter(id => !contactIds.has(id));
            if (missingIds.length > 0) {
                const { data: missingUsers } = await _supabase
                    .from('users')
                    .select('*')
                    .in('id', missingIds);
                if (missingUsers) {
                    nonContactUsers = missingUsers;
                }
            }
        }
        
        globalContacts = contactsData;
        
        const privateListStr = localStorage.getItem(`vchat_private_list_${currentUser.id}`) || '[]';
        const privateList = JSON.parse(privateListStr);
        
        const signature = JSON.stringify([
            privateList,
            ...contactsData.map(c => {
                const contact = c.sender_id === currentUser.id ? c.receiver : c.sender;
                if (!contact) return null;
                const isOnline = window.onlineUsersList && window.onlineUsersList.includes(contact.id);
                return { id: contact.id, name: contact.name, status: isOnline ? 'online' : 'offline', avatar: contact.avatar_url, song: contact.listening_to, is_premium: contact.is_premium, isContact: true };
            }),
            ...nonContactUsers.map(u => {
                const isOnline = window.onlineUsersList && window.onlineUsersList.includes(u.id);
                return { id: u.id, name: u.name, status: isOnline ? 'online' : 'offline', avatar: u.avatar_url, song: u.listening_to, is_premium: u.is_premium, isContact: false };
            })
        ].filter(Boolean));
        
        if (window.lastContactsSignature === signature) {
            updateActiveChatStatus();
            return;
        }
        window.lastContactsSignature = signature;
        
        const container = document.getElementById('contactList');
        container.innerHTML = '';
        
        if (contactsData.length === 0 && nonContactUsers.length === 0) {
            container.innerHTML = `<p style="text-align:center; color:var(--text-sec); font-size:13px; margin-top:20px; padding:0 10px;">No tienes amigos agregados. Envía solicitudes usando su ID único.</p>`;
            return;
        }
        
        contactsData.forEach(c => {
            const contact = c.sender_id === currentUser.id ? c.receiver : c.sender;
            if (!contact) return;
            
            if (privateList.includes(contact.id)) {
                return;
            }
            
            const isOnline = window.onlineUsersList && window.onlineUsersList.includes(contact.id);
            const isContactVip = contact.is_premium;
            const vipCrownHtml = isContactVip ? `<span class="vip-crown" title="Usuario VIP"><i class="fas fa-crown"></i></span>` : '';
            
            let subTextHtml = `<p style="font-size:12px; color:var(--text-sec); margin-top:2px;">Toca para chatear</p>`;
            if (contact.listening_to && contact.listening_to.trim() !== '') {
                subTextHtml = `
                    <p style="font-size:12px; color:var(--vchat-green); margin-top:2px; display:flex; align-items:center; gap:5px; font-weight: 500;">
                        <i class="fas fa-music" style="font-size:10px; animation: pulse 1.5s infinite ease-in-out;"></i>
                        <span style="font-style:italic; max-width:180px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">Escuchando: ${contact.listening_to}</span>
                    </p>
                `;
            }
            
            const itemHtml = `
                <img id="contact-avatar-img-${contact.id}" src="${contact.avatar_url}" class="avatar-sm" alt="Avatar">
                <div style="flex:1;">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <strong style="font-size:15px; color:var(--text-main); display: inline-flex; align-items: center; gap: 5px;">${contact.name}${vipCrownHtml}</strong>
                        <span style="font-size:10px; color:${isOnline ? 'var(--vchat-green)' : 'var(--text-sec)'}; font-weight:bold;">
                            <i class="fas fa-circle" style="font-size:7px; margin-right:4px;"></i>${isOnline ? 'en línea' : 'offline'}
                        </span>
                    </div>
                    ${subTextHtml}
                </div>
            `;
            
            const item = document.createElement('div');
            item.className = 'contact-item';
            item.id = `contact-item-id-${contact.id}`;
            item.style.display = 'flex';
            item.style.alignItems = 'center';
            item.style.gap = '15px';
            item.style.padding = '14px 18px';
            item.style.cursor = 'pointer';
            item.style.borderRadius = '14px';
            item.style.marginBottom = '6px';
            item.style.transition = 'all 0.2s';
            item.innerHTML = itemHtml;
            
            container.appendChild(item);
        });

        contactsData.forEach(c => {
            const contact = c.sender_id === currentUser.id ? c.receiver : c.sender;
            if (!contact || privateList.includes(contact.id)) return;
            
            const itemDiv = document.getElementById(`contact-item-id-${contact.id}`);
            if (itemDiv) {
                let lastContactTap = 0;
                itemDiv.onclick = (e) => {
                    const now = Date.now();
                    const timespan = now - lastContactTap;
                    
                    if (timespan < 300 && timespan > 0) {
                        window.toggleContactPrivacy(contact.id, contact.name);
                    } else {
                        setTimeout(() => {
                            if (Date.now() - lastContactTap >= 300) {
                                window.startChat(contact.id, contact.name, contact.avatar_url);
                            }
                        }, 250);
                    }
                    lastContactTap = now;
                };
            }
        });

        nonContactUsers.forEach(u => {
            const isOnline = window.onlineUsersList && window.onlineUsersList.includes(u.id);
            const isVip = u.is_premium;
            const vipCrownHtml = isVip ? `<span class="vip-crown" title="Usuario VIP"><i class="fas fa-crown"></i></span>` : '';
            
            let subTextHtml = `<p style="font-size:12px; color:var(--vchat-green); margin-top:2px;">Chat Directo (No Agregado)</p>`;
            if (u.listening_to && u.listening_to.trim() !== '') {
                subTextHtml = `
                    <p style="font-size:12px; color:var(--vchat-green); margin-top:2px; display:flex; align-items:center; gap:5px; font-weight: 500;">
                        <i class="fas fa-music" style="font-size:10px; animation: pulse 1.5s infinite ease-in-out;"></i>
                        <span style="font-style:italic; max-width:180px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">Escuchando: ${u.listening_to}</span>
                    </p>
                `;
            }
            
            const itemHtml = `
                <img src="${u.avatar_url}" class="avatar-sm" alt="Avatar">
                <div style="flex:1;">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <strong style="font-size:15px; color:var(--text-main); display: inline-flex; align-items: center; gap: 5px;">${u.name}${vipCrownHtml}</strong>
                        <span style="font-size:10px; color:${isOnline ? 'var(--vchat-green)' : 'var(--text-sec)'}; font-weight:bold;">
                            <i class="fas fa-circle" style="font-size:7px; margin-right:4px;"></i>${isOnline ? 'en línea' : 'offline'}
                        </span>
                    </div>
                    ${subTextHtml}
                </div>
            `;
            
            const item = document.createElement('div');
            item.className = 'contact-item';
            item.style.display = 'flex';
            item.style.alignItems = 'center';
            item.style.gap = '15px';
            item.style.padding = '14px 18px';
            item.style.cursor = 'pointer';
            item.style.borderRadius = '14px';
            item.style.marginBottom = '6px';
            item.style.transition = 'all 0.2s';
            item.style.border = '1px dashed rgba(0, 191, 165, 0.15)';
            item.innerHTML = itemHtml;
            
            item.onclick = () => {
                window.startChat(u.id, u.name, u.avatar_url);
            };
            
            container.appendChild(item);
        });

        const settingsManager = document.getElementById('settings-contacts-manager');
        if (settingsManager) {
            if (contactsData.length === 0) {
                settingsManager.innerHTML = `<p style="font-size:11.5px; color:var(--text-sec); text-align:center; padding:10px 0;">No tienes contactos agregados.</p>`;
            } else {
                settingsManager.innerHTML = contactsData.map(c => {
                    const contact = c.sender_id === currentUser.id ? c.receiver : c.sender;
                    if (!contact) return '';
                    return `
                        <div style="display:flex; justify-content:space-between; align-items:center; padding:6px 0; border-bottom:1px solid rgba(255,255,255,0.02);">
                            <span style="font-size:13px; color:var(--text-main); font-weight:500;">${contact.name}</span>
                            <i class="fas fa-trash-alt" onclick="window.deleteContact('${contact.id}', '${contact.name}')" style="color:#ff3b30; cursor:pointer; font-size:13px;" title="Eliminar Contacto"></i>
                        </div>
                    `;
                }).join('');
            }
        }

        updateActiveChatStatus();
    } catch (contactsErr) {
        console.warn("No se pudo cargar la lista de contactos:", contactsErr);
    }
}

_supabase.channel('realtime-users-presence')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, () => {
        window.lastContactsSignature = "";
        loadContacts();
    }).subscribe();

window.startChat = (id, name, avatar) => {
    try {
        activeChatId = id;
        window.showChatView();
        
        const contactNameLabel = document.getElementById('active-contact-name');
        if (contactNameLabel) contactNameLabel.innerText = name;
        
        const avatarUi = document.getElementById('target-avatar-ui');
        if (avatarUi) avatarUi.innerHTML = `<img src="${avatar || 'https://ui-avatars.com/api/?name=' + name}" class="avatar-sm" alt="Avatar">`;
        
        const navbar = document.getElementById('chat-navbar');
        if (navbar && !document.getElementById('clear-chat-btn')) {
            const clearBtn = document.createElement('button');
            clearBtn.id = 'clear-chat-btn';
            clearBtn.title = "Vaciar Chat";
            clearBtn.style = "background:none; border:none; font-size:18px; color:var(--text-sec); cursor:pointer; padding:8px; transition:color 0.2s;";
            clearBtn.innerHTML = `<i class="fas fa-trash"></i>`;
            clearBtn.onmouseover = () => clearBtn.style.color = '#ff3b30';
            clearBtn.onmouseout = () => clearBtn.style.color = 'var(--text-sec)';
            
            navbar.appendChild(clearBtn);
            clearBtn.onclick = () => clearActiveChat();
        }
        
        updateActiveChatStatus();
        loadMessages();
    } catch (err) {
        console.error("Error en startChat:", err);
    }
};

function showToast(m, e = false) {
    const t = document.getElementById('toast-notification');
    if (!t) return;
    document.getElementById('toast-message').innerText = m;
    t.style.display = 'block'; t.style.background = e ? '#ff3b30' : '#00bfa5';
    setTimeout(() => t.style.display = 'none', 3000);
}

async function requestNotificationPermission() {
    try {
        if (window.Notification && Notification.permission !== 'granted') {
            await Notification.requestPermission();
        }
    } catch (e) {
        console.warn("Fallo al solicitar permisos de notificación:", e);
    }
}

function playNotificationSound() {
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(587.33, audioCtx.currentTime);
        oscillator.frequency.setValueAtTime(880, audioCtx.currentTime + 0.1);
        
        gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
        
        oscillator.start(audioCtx.currentTime);
        oscillator.stop(audioCtx.currentTime + 0.3);
    } catch (e) {
        console.warn("Sonido omitido por restricciones del navegador:", e);
    }
}

async function showSystemNotification(senderId, messageId) {
    if (messageId && notifiedMessageIds.includes(messageId)) return;
    if (messageId) notifiedMessageIds.push(messageId);

    playNotificationSound();
    
    try {
        const { data: sender } = await _supabase.from('users').select('name').eq('id', senderId).single();
        const senderName = sender ? sender.name : "Un usuario";
        
        if (window.Notification && Notification.permission === 'granted') {
            new Notification("V-Chat", {
                body: `Recibiste un mensaje de ${senderName}`,
                icon: 'https://ui-avatars.com/api/?name=VChat&background=00a884&color=fff'
            });
        }
    } catch (err) {
        console.warn("Fallo al disparar notificación:", err);
    }
}

window.onload = async () => {
    try {
        const { data, error } = await _supabase.auth.getSession();
        if (error) throw error;
        if (data && data.session) {
            await showApp(data.session.user);
        }
    } catch (err) {
        console.error("Error al restaurar sesión activa:", err);
    }
};

setInterval(() => {
    if (currentUser) {
        if (isMediaPlaying()) return;
        if (Date.now() - lastInteractionTime < 3000) return;
        
        loadContacts();
        loadIncomingRequests();
        loadStatuses();
        if (activeChatId) {
            loadMessages();
        }
    }
}, 5000);

// =======================================================
// 12. CONTROL SEGURO DE PUBLICIDAD
// =======================================================
function loadSafeAd() {
    const container = document.getElementById('adsterra-banner-container');
    if (!container) return;
    
    if (currentUser && currentUser.is_premium) {
        container.style.display = 'none';
        return;
    }
    
    container.innerHTML = ''; 
    
    const iframe = document.createElement('iframe');
    iframe.style.width = '320px';
    iframe.style.height = '50px';
    iframe.style.border = 'none';
    iframe.style.overflow = 'hidden';
    iframe.scrolling = 'no';
    
    iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms');
    
    container.appendChild(iframe);
    
    const adHtml = `
        <html style="margin:0; padding:0; overflow:hidden;">
        <body style="margin:0; padding:0; overflow:hidden; background:transparent; display:flex; justify-content:center; align-items:center;">
            <script type="text/javascript">
                atOptions = {
                    'key' : 'ce71424fc983cc29c763e0e5e6d63157',
                    'format' : 'iframe',
                    'height' : 50,
                    'width' : 320,
                    'params' : {}
                };
            </script>
            <script type="text/javascript" src="https://www.highperformanceformat.com/ce71424fc983cc29c763e0e5e6d63157/invoke.js"></script>
        </body>
        </html>
    `;
    
    const doc = iframe.contentDocument || iframe.contentWindow.document;
    doc.open();
    doc.write(adHtml);
    doc.close();
}