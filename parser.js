var fs = require("fs"),
    path = require("path");
var prefix = "./ArknightsGameData/zh_CN/gamedata/";
var prefix2 = "./ASSD/zh_CN/"
function ensureDirectoryExistence(filePath) {
    var dirname = path.dirname(filePath);
    if (fs.existsSync(dirname)) {
        return true;
    }
    ensureDirectoryExistence(dirname);
    fs.mkdirSync(dirname);
}
function checkSubSet(parentArray, subsetArray) {
    return subsetArray.every((el) => {
        return parentArray.includes(el)
    })
}
function parseTxt(storyMeta) {
    var txt = fs.readFileSync(prefix + 'story/' + storyMeta.storyTxt + '.txt').toString();
    var lines_raw = txt.split('\n');
    // console.log(lines_raw);
    const r1 = /\[(\w+)(?:\((.*?)\))?\](.*)/;
    const r2 = /\[name="([^"]*)"\](.*)/;
    const r3 = /\[(\w+)=(".*?"|\d+)\]/;
    var lines = [];
    var characters = new Set();
    var lrid = 0;
    for (var line_raw of lines_raw) {
        var line_dialogue = {};
        const match_others = line_raw.match(r1);
        const match_dialogue = line_raw.match(r2);
        const match_arg=line_raw.match(r3);
        if (match_others) {
            const [, type, paramsStr, after] = match_others;
            line_dialogue["type"] = type;
            if (paramsStr) {
                const r3 = /([A-Za-z0-9]+)(?:\s*=\s*("|'|)(.*?)(\2))?(?=\s*,|$)/g;
                paramsStr.replace(r3, (_a, k, _s, v) => {
                    line_dialogue[k.trim()] = v || true;
                    return '';
                });
            }
            if (after) {
                line_dialogue["text"] = after.trim();
            }
        } else if (match_dialogue) {
            const [, name, after] = match_dialogue;
            line_dialogue["type"] = "Dialogue";
            line_dialogue["name"] = name;
            if (after) {
                line_dialogue["text"] = after.trim();
            }
        } else if (match_arg){
            const paramName = match_arg[1];
            const paramValue = match_arg[2].startsWith('"') ? match_arg[2].slice(1, -1) : match_arg[2];
            line_dialogue["type"] = paramName;
            line_dialogue['param'] = paramValue;
        }
        else {
            line_dialogue["type"] = "Text";
            line_dialogue["text"] = line_raw.trim();
        }
        line_dialogue.id = lrid;
        lrid++;
        lines.push(line_dialogue);
    }
    var current_figure = null;
    var char_slot = {};
    var musicid=0;
    var current_decision_id, current_predicate_id = null;
    for (id in lines) {
        // console.log(lines[id]);
        switch (lines[id].type) {

            case "Character":
                // console.log(lines[id]);
                if (lines[id].name) {
                    if (lines[id].focus) {
                        current_figure = lines[id]["name" + (parseInt(lines[id].focus,10) > 1 ? lines[id].focus : "")];
                    } else {
                        current_figure = lines[id].name;
                    }
                } else {
                    current_figure = null;
                }
                break;
            case "charslot":
                if (lines[id].name) {
                    char_slot[lines[id].slot] = lines[id].name;
                    if (!lines[id].focus) {
                        current_figure = char_slot[lines[id].slot];
                    }
                }
                if (lines[id].slot) {
                    if (lines[id].focus && lines[id].focus != "none") {
                        current_figure = char_slot[lines[id].slot];
                    }
                } else {
                    char_slot = {};
                    current_figure = null;
                }
                // console.log(current_figure);
                break;

            case "Dialogue":
                // console.log(lines[id]);
                if (current_figure) {
                    lines[id].figure = current_figure;
                    // console.log(lines[id]);
                }
                if (lines[id].name) {
                    characters.add(lines[id].name);
                }
                break;
            case "playMusic":
            case "PlayMusic":
                if(lines[id].key){
                    lines[id].musicid=musicid;
                    musicid++;
                }
                break;
            case "Decision":
                // console.log(lines[id]);
                lines[id].options = lines[id].options.split(";");
                lines[id].values = lines[id].values.split(";");
                // console.log(lines[id]);
                current_decision_id = id;
                current_predicate_id = null;
                break;
            case "Predicate":
                if (!lines[id].references) {
                    break;
                }
                lines[id].references = lines[id].references.split(";");
                if (current_predicate_id) {
                    lines[current_predicate_id].end = id - 1;
                }
                if (current_decision_id) {
                    if (checkSubSet(lines[current_decision_id].values, lines[id].references)) {
                        current_predicate_id = id;
                        for (var ref of lines[id].references) {
                            lines[current_decision_id].options[parseInt(ref) - 1] = { id: id, text: lines[current_decision_id].options[parseInt(ref) - 1] }
                        }
                        lines[current_decision_id].values = lines[current_decision_id].values.filter((el) => !lines[id].references.includes(el));

                    } else {
                        lines[id].type="useless";
                        lines[id-1].end=true;
                        current_predicate_id = null;
                        current_decision_id = null;
                    }
                }
                break;
            case "dialog":
                if (current_predicate_id) {
                    lines[current_predicate_id].end = id - 1;
                    lines[id-1].end=true;
                    current_predicate_id = null;
                }

                break;
            case "Text":
                // console.log(lines[id].text);
                break;
            default:
                // lines[id]={}
                break;
        }
    }
    var story = { storyMeta, lines, characters: Array.from(characters) }
    // console.log(lines);
    return story;
}

// 同步读取
var data = fs.readFileSync(prefix + 'excel/story_review_table.json');
var activities = JSON.parse(data.toString());
data = fs.readFileSync(prefix + 'excel/character_table.json');
var char_table = JSON.parse(data.toString());
ensureDirectoryExistence(prefix2);
for (var key of Object.keys(char_table)){
    char_table[key].id=key;
    delete Object.assign(char_table, {[key.split("_")[2]]: char_table[key] })[key];
}
fs.rmSync("./ASSD", { recursive: true, force: true });
var acts=[];
for (var [key, activity] of Object.entries(activities)) {
    if (activity.entryType=="NONE"){
        var char=char_table[activity.id.split("_")[1]]
        if(char){
            activity.charname=char.name;
            // console.log(activity.charname);
        }
    }
    switch (activity.entryType) {
        case "NONE":
            activity.type="干员密录"
            break;  
        case "ACTIVITY":
            activity.type="支线"
            break;
        case "MINI_ACTIVITY":
            activity.type="剧情"
            break;
        case "MAINLINE":
            activity.type="主线"
            break;
        default:
            break;
    }
    var chars=[];
    for (story_meta_id in activity.infoUnlockDatas) {
        if(story_meta_id>0){
            activity.infoUnlockDatas[story_meta_id].prev=Number(story_meta_id)-1;
        }
        if(story_meta_id<activity.infoUnlockDatas.length-1){
            activity.infoUnlockDatas[story_meta_id].next=Number(story_meta_id)+1;
        }
        activity.infoUnlockDatas[story_meta_id].storyInfo = fs.readFileSync(prefix + 'story/[uc]'+activity.infoUnlockDatas[story_meta_id].storyInfo+'.txt').toString();
        console.log(activity.infoUnlockDatas[story_meta_id].storyName);
        
        var res = parseTxt(activity.infoUnlockDatas[story_meta_id])
        activity.infoUnlockDatas[story_meta_id].characters = res.characters;
        chars=chars.concat(res.characters);
        ensureDirectoryExistence(prefix2 + activity.infoUnlockDatas[story_meta_id].storyTxt + ".json");
        fs.writeFileSync(prefix2 + activity.infoUnlockDatas[story_meta_id].storyTxt + ".json", JSON.stringify(res));
    }
    activity.characters=Array.from(new Set(chars));
    acts.push(activity);
}
ensureDirectoryExistence(prefix2 + "main.json");
fs.writeFileSync(prefix2 + "main.json", JSON.stringify(acts));