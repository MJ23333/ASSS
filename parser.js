(async ()=>{
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
function convertToChinaNum(num) {
    var arr1 = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
    var arr2 = ['', '十', '百', '千', '万', '十', '百', '千', '亿', '十', '百', '千','万', '十', '百', '千','亿'];//可继续追加更高位转换值
    if(!num || isNaN(num)){
        return "零";
    }
    var english = num.toString().split("")
    var result = "";
    for (var i = 0; i < english.length; i++) {
        var des_i = english.length - 1 - i;//倒序排列设值
        result = arr2[i] + result;
        var arr1_index = english[des_i];
        result = arr1[arr1_index] + result;
    }
    //将【零千、零百】换成【零】 【十零】换成【十】
    result = result.replace(/零(千|百|十)/g, '零').replace(/十零/g, '十');
    //合并中间多个零为一个零
    result = result.replace(/零+/g, '零');
    //将【零亿】换成【亿】【零万】换成【万】
    result = result.replace(/零亿/g, '亿').replace(/零万/g, '万');
    //将【亿万】换成【亿】
    result = result.replace(/亿万/g, '亿');
    //移除末尾的零
    result = result.replace(/零+$/, '')
    //将【零一十】换成【零十】
    //result = result.replace(/零一十/g, '零十');//貌似正规读法是零一十
    //将【一十】换成【十】
    result = result.replace(/^一十/g, '十');
    return result;
}
 async function getContent(page) {
    var endpoint = "https://prts.wiki/api.php?action=query&prop=revisions&rvprop=content&origin=*&format=json&&titles=" + page;
    const response = await fetch(endpoint);
    let data = await response.json();
    // console.log(data);
    let key = Object.keys(data.query.pages)[0];
    return data.query.pages[key].revisions[0]["*"];
}
function stringToObject(input) {
    const lines = input.trim().split('\n');
    const result = {};

    for (const line of lines) {
        const [key, value] = line.split(',');
        result[key.trim()] = "https://prts.wiki"+value.trim();
    }

    return result;
}
const source_url = "https://static.prts.wiki/";
 async function getImageMap() {
    var unparsed =await getContent("Widget:Data_Image");
    unparsed=unparsed.replaceAll("</includeonly>","").replaceAll("<includeonly>","");
    return stringToObject(unparsed);
}
 async function getMusicMap() {
    var unparsed =await getContent("Widget:Data_Audio");
    unparsed=unparsed.replaceAll("</includeonly>","").replaceAll("<includeonly>","").toLowerCase();
    var res=await JSON.parse(unparsed);
    for(let k in res){
        // console.log(res[k]);
        // res[k]=res[k].toLocaleLowerCase();
        if(res[k].toString().indexOf("sound_beta_2") == -1) continue;
        res[k] = res[k].replace("sound_beta_2",source_url + "music") + ".mp3";
    }
    console.log(res);
    res["btn_click"] = source_url + "music/general/g_ui/g_ui_btn_n.mp3";
    // unparsed=unparsed.replaceAll("</includeonly>","").replaceAll("<includeonly>","");
    return res;
}
 async function getLinkMap() {
    var unparsed =await getContent("Widget:Data_Link");
    var res=await JSON.parse(unparsed);
    // unparsed=unparsed.replaceAll("</includeonly>","").replaceAll("<includeonly>","");
    return res;
}
 async function getCharMap() {
    var unparsed =await getContent("Widget:Data_Char");
    unparsed=unparsed.replaceAll("</includeonly>","").replaceAll("<includeonly>","");
    return stringToObject(unparsed);
}
 async function getImage(name) {
    var endpoint = "https://prts.wiki/api.php?action=query&titles=&origin=*&titles=文件:" + name+"&prop=imageinfo&iiprop=url&format=json";
    console.log(endpoint);
    const response = await fetch(endpoint);
    let data = await response.json();
    // console.log(data);
    let key = Object.keys(data.query.pages)[0];
    return data.query.pages[key].imageinfo[0].url;
}
 async function getCover(query) {
    var endpoint = "https://prts.wiki/api.php?action=query&titles=&origin=*&titles=";
    for (var q of query){
        endpoint+="文件:"+q+"|";
    }
    endpoint=endpoint.slice(0,-1);
    endpoint+="&prop=imageinfo&iiprop=url&format=json";
    console.log(endpoint);
    const response = await fetch(endpoint);
    let data = await response.json();
    // console.log(data);
    var covers=[];
    let keys = Object.keys(data.query.pages)
    for(var page of keys){
        covers.push({key:data.query.pages[page].title.replace("文件:",""),value:data.query.pages[page].imageinfo[0].url});
    }
    return covers;
}
function chunk(array, size) {
    //获取数组的长度，如果你传入的不是数组，那么获取到的就是undefined
    const length = array.length
    //判断不是数组，或者size没有设置，size小于1，就返回空数组
    if (!length || !size || size < 1) {
      return []
    }
    //核心部分
    let index = 0 //用来表示切割元素的范围start
    let resIndex = 0 //用来递增表示输出数组的下标
  
    //根据length和size算出输出数组的长度，并且创建它。
    let result = new Array(Math.ceil(length / size))
    //进行循环
    while (index < length) {
      //循环过程中设置result[0]和result[1]的值。该值根据array.slice切割得到。
      result[resIndex++] = array.slice(index, (index += size))
    }
    //输出新数组
    return result
  }
 async function findCover(activities) {
    var reg = /[\u3002|\uff1f|\uff01|\uff0c|\u3001|\uff1b|\uff1a|\u201c|\u201d|\u2018|\u2019|\uff08|\uff09|\u300a|\u300b|\u3008|\u3009|\u3010|\u3011|\u300e|\u300f|\u300c|\u300d|\ufe43|\ufe44|\u3014|\u3015|\u2026|\u2014|\uff5e|\ufe4f|\uffe5]/g;
    var mainline_count=1;
    var query=[];
    for (var act of activities){
        // console.log(act);
        if((act.type=="支线"||act.type=="剧情")&&act.name!="特殊"){
            query.push("活动名称_"+act.name.replaceAll(reg,"").replaceAll(" ","_").trim()+".png");
            // console.log(act.cover);
        }
        else if(act.type=="主线"){
            if(mainline_count==1){
                query.push("章节名称_序章.png");
            }else{
                query.push("章节名称_第"+convertToChinaNum(mainline_count-1)+"章.png");
            }
            mainline_count++;
        }

    }
    var queries=chunk(query,45);
    var r=[];
    for (var q of queries){
        r.push(await getCover(q))
    }
    console.log(r);
    const covers = r.flat().reduce((obj, item) => ({
        ...obj,
        [item.key]: item.value
      }), {});
    console.log(covers);
    mainline_count=1;
    for (var act of activities){
        // console.log(act);
        if((act.type=="支线"||act.type=="剧情")&&act.name!="特殊"){
            if(covers["活动名称 "+act.name.replaceAll(reg,"").trim()+".png"]){
                act.cover=covers["活动名称 "+act.name.replaceAll(reg,"").trim()+".png"];
            }
            // console.log(act.cover);
        }
        else if(act.type=="主线"){
            var name;
            if(mainline_count==1){
                name="章节名称 序章.png";
            }else{
                name="章节名称 第"+convertToChinaNum(mainline_count-1)+"章.png";
            }
            console.log(name);
            if(covers[name]){
                act.cover=covers[name];
            
            }
            mainline_count++;
        }

    }
}
function fun_get_audio_url(key) {
    if (!key) return '';
    let p = key.toLowerCase();
    return key.startsWith('$')
        ? musicmap[p.substr(1)]
        : key.startsWith('@')
        ? source_url + p.substr(1)
        : source_url + p.replace('sound_beta_2', 'music') + '.mp3';
}
function fun_char_link(key_data) {
    let n,
        i,
        links = linkmap;
    // console.log(key_data);
    let m = key_data.match(/^([^@#$]+)(?:([@#$])([a-z\d]+)|#(\d+)\$(\d+))?$/);
    if (m == null) {
        return fun_char_format([-1, -1]);
    }
    (n = m[1]), (i = m[3]);
    if (links[n] == undefined) {
        return fun_char_format([-1, -1]);
    }
    if (m[2] == '$' || (m[4] && m[5])) {
        let g = '$' + (m[5] || i); //group
        i = m[4] || i;
        let ps = links[n].array.findIndex((v) => v.name.endsWith(g)),
            pe = links[n].array.findIndex((v, vi) => !v.name.endsWith(g) && vi > ps);
        if (ps == -1) {
            return fun_char_format([n, 0]);
        }
        pe = pe == -1 ? links[n].array.length - 1 : pe - 1;
        if (m[2]) return fun_char_format([n, ps]);
        try {
            i--;
        } catch (err) {
            i = ps;
        }
        if (i > pe - ps) {
            i = ps;
        }
        return fun_char_format([n, i + ps]);
    } else if (m[2] == '#') {
        try {
            i--;
        } catch (err) {
            i = 0;
        }
        if (i >= links[n].array.length) {
            i = 0;
        }
        return fun_char_format([n, i]);
    } else if (m[2] == '@') {
        for (let idx = 0; idx < links[n].array.length; idx++)
            if (links[n].array[idx].alias == i) return [n, idx];
        return [n, 0];
    }
    return fun_char_format([n, 0]);
}
function fun_char_format(keys) {
    var key = keys[0],
        idx = keys[1];
    if (!linkmap[key]) {
        return null;
    }
    return charmap[linkmap[key].array[idx].name];
}
function transslot(slot){
    if (slot=="right"||slot=="r"){
        return "r";
    }else if (slot=="middle"||slot=="m"){
        return "m";
    }else if (slot=="left"||slot=="l"){
        return "l";
    }else {
        return "n";
    }
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
            line_dialogue["type"] = "dialogue";
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
            line_dialogue["type"] = "text";
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
        lines[id].type=lines[id].type.toLowerCase();
        // console.log(lines[id]);
        switch (lines[id].type) {

            case "character":
                console.log(lines[id]);
                // console.log(lines[id]);
                if (lines[id].name&&typeof lines[id].name==="string") {
                    if (lines[id].focus&&(lines[id]["name" + (Number(lines[id].focus,10) > 1 ? lines[id].focus : "")])) {
                        current_figure = fun_char_link(lines[id]["name" + (Number(lines[id].focus,10) > 1 ? lines[id].focus : "")]);
                    } else {
                        console.log(lines[id].name);
                        current_figure = fun_char_link(lines[id].name);
                    }
                } else {
                    current_figure = null;
                }
                break;
            case "charslot":
                // console.log(lines[id]);
                if (lines[id].name) {
                    // console.log(char_slot);
                    char_slot[transslot(lines[id].slot)] = lines[id].name;
                    if (!lines[id].focus) {
                        current_figure = fun_char_link(char_slot[transslot(lines[id].slot)]);
                    }
                }
                // console.log(char_slot);
                if (lines[id].focus && char_slot[transslot(lines[id].focus)]) {
                    current_figure = fun_char_link(char_slot[transslot(lines[id].focus)]);
                }
                if(Object.keys(lines[id]).length<=1) {
                    char_slot = {};
                    current_figure = null;
                }
                // console.log(current_figure);
                break;

            case "dialogue":
                // console.log(lines[id]);
                if (current_figure) {
                    lines[id].figure = current_figure;
                    // console.log(lines[id]);
                }
                if (lines[id].name) {
                    characters.add(lines[id].name);
                }
                break;
            case "playmusic":
                if(lines[id].key){
                    lines[id].key=fun_get_audio_url(lines[id].key);
                    lines[id].musicid=musicid;
                    musicid++;
                }
                break;
            case "decision":
                // console.log(lines[id]);
                lines[id].options = lines[id].options.split(";");
                lines[id].values = lines[id].values.split(";");
                var opts={};
                for(var opt in lines[id].options){
                    opts[Number(lines[id].values[opt])]=lines[id].options[opt];
                }
                lines[id].options=opts;
                // console.log(lines[id]);
                current_decision_id = id;
                current_predicate_id = null;
                break;
            case "predicate":
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
                            lines[current_decision_id].options[Number(ref)] = { id: id, text: lines[current_decision_id].options[Number(ref)] }
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
            case "image":
                if(lines[id].image){
                    if(!imagemap[lines[id].image.toLowerCase()]){
                        console.log(lines[id].image);
                    }else{
                        lines[id].image=imagemap[lines[id].image.toLowerCase()];
                    }
                    
                }
            case "background":
                if(lines[id].image){
                    lines[id].image=imagemap['bg_' + lines[id].image.toLowerCase()]
                }
            case "text":
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
var linkmap=await getLinkMap();
var charmap=await getCharMap();
var imagemap=await getImageMap();
var musicmap=await getMusicMap();
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
        // console.log(activity.infoUnlockDatas[story_meta_id].storyName);
        
        var res = parseTxt(activity.infoUnlockDatas[story_meta_id])
        activity.infoUnlockDatas[story_meta_id].characters = res.characters;
        chars=chars.concat(res.characters);
        ensureDirectoryExistence(prefix2 + activity.infoUnlockDatas[story_meta_id].storyTxt + ".json");
        fs.writeFileSync(prefix2 + activity.infoUnlockDatas[story_meta_id].storyTxt + ".json", JSON.stringify(res));
    }
    activity.characters=Array.from(new Set(chars));
    acts.push(activity);
}
await findCover(acts);
ensureDirectoryExistence(prefix2 + "main.json");
fs.writeFileSync(prefix2 + "main.json", JSON.stringify(acts));
})();