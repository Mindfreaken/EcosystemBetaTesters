import fs from 'fs';
import path from 'path';

const basePath = 'c:\\\\Users\\\\chuck\\\\Ecosystem';
const sourceFile = path.join(basePath, 'convex/spaces.ts');
const content = fs.readFileSync(sourceFile, 'utf8');

const groups = {
    'core.ts': ['getUserOwnedSpacesCount', 'getUserSpaces', 'getSpace', 'createSpace', 'updateSpaceMetadata', 'deleteSpace', 'updateSpacePrivacy', 'getMe'],
    'members.ts': ['getMyRole', 'getSpaceMembers', 'getSpaceMember', 'getSpaceAdmins', 'setMemberRole', 'kickMember', 'leaveSpace'],
    'channels.ts': ['getChannels', 'getCategories', 'createCategory', 'updateCategory', 'deleteCategory', 'createChannel', 'updateChannel', 'deleteChannel', 'updateChannelPermissions'],
    'messages.ts': ['getChannelMessages', 'sendChannelMessage', 'deleteChannelMessage', 'toggleChannelMessageReaction', 'bulkDeleteUserMessages'],
    'moderation.ts': ['timeoutUser', 'banUser', 'unbanUser', 'getSpaceBans', 'getSpaceTimeouts'],
    'invites.ts': ['createInvite', 'revokeInvite', 'toggleInvites', 'joinSpaceByCode', 'getSpaceInvites', 'getInviteLeaderboard', 'getInvitedMembersByUser'],
    'voice.ts': ['heartbeatVoicePresence', 'leaveVoicePresence', 'getVoicePresence'],
    'emojis.ts': ['generateEmojiUploadUrl', 'saveCustomEmoji', 'deleteCustomEmoji', 'getSpaceCustomEmojis'],
    'welcome.ts': ['setupWelcomeCategory', 'getWelcomeContent'],
    'analytics.ts': ['trackSpaceView', 'getSpaceStats'],
    'audit.ts': ['getAdminActions', 'getAdminActionStats', 'getActionsByAdmin']
};

const header = `import { v } from "convex/values";
import { query, mutation } from "../_generated/server";
import { Id } from "../_generated/dataModel";
import { ensureUserActive } from "../auth/helpers";

`;

const blocks = {};
let currentBlock = [];
let docComment = [];
let inBlock = false;
let funcName = null;

const lines = content.split('\n');
for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Simple parser for /** ... */
    if (!inBlock) {
        if (line.trim().startsWith('/**') || (docComment.length > 0 && line.trim().startsWith('*'))) {
            docComment.push(line);
            continue;
        }
    }

    if (line.startsWith('export const')) {
        inBlock = true;
        funcName = line.split(' ')[2];
        currentBlock = [...docComment, line];
        docComment = [];
        continue;
    }

    if (inBlock) {
        currentBlock.push(line);
        if (line === '});') {
            inBlock = false;
            blocks[funcName] = currentBlock.join('\n');
            currentBlock = [];
        }
    }
}

const spacesDir = path.join(basePath, 'convex/spaces');
if (!fs.existsSync(spacesDir)) {
    fs.mkdirSync(spacesDir);
}

for (const [file, funcs] of Object.entries(groups)) {
    let fileContent = header;
    for (const func of funcs) {
        if (blocks[func]) {
            fileContent += blocks[func] + '\n\n';
        } else {
            console.error('Missing func: ' + func);
        }
    }
    fs.writeFileSync(path.join(spacesDir, file), fileContent);
}

fs.renameSync(sourceFile, sourceFile + '.bak');
console.log('Successfully split spaces.ts');

// --- FRONTEND UPDATE ---

const srcPath = path.join(basePath, 'src');

const funcToFile = {};
for (const [f, funcs] of Object.entries(groups)) {
    const mod = f.replace('.ts', '');
    for (const fn of funcs) {
        funcToFile[fn] = mod;
    }
}

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function (file) {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else {
            if (file.endsWith('.ts') || file.endsWith('.tsx')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = walk(srcPath);

for (const file of files) {
    let fileContent = fs.readFileSync(file, 'utf8');
    let changed = false;

    for (const [func, mod] of Object.entries(funcToFile)) {
        // Find exact matches like "api.spaces.getChannels"
        const regex = new RegExp("api\\\\.spaces\\\\." + func + "\\\\b", "g");
        if (regex.test(fileContent)) {
            fileContent = fileContent.replace(regex, "api.spaces." + mod + "." + func);
            changed = true;
        }
    }

    if (changed) {
        fs.writeFileSync(file, fileContent);
        console.log("Updated " + file);
    }
}
console.log('Frontend references updated.');
