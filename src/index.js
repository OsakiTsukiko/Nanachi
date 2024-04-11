const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const window_actions = require('./js/window_actions');
const ls = window.localStorage;

let build_cmd, run_cmd, bar_cmd, run_timer;
let master_path = os.homedir();
let USE_LAST_CODE = 1;

let def_code;
let code;

let fileLastRunCont = {
    "in": "",
    "out": ""
}

// it might be a good ideea not to store
// code inside localstorage.... but im too lazy
// ;-;

let fileTVar = 1; // im running out of names... 

let editor = ace.edit('editor');
let top_editor = ace.edit('topEditor');
let bottom_editor = ace.edit('bottomEditor');

ace.require("ace/ext/language_tools");

editor.setTheme('ace/theme/dracula');
editor.session.setMode('ace/mode/c_cpp');
editor.setOptions({
    enableBasicAutocompletion: true,
    enableSnippets: true,
    enableLiveAutocompletion: true
});

top_editor.setTheme('ace/theme/dracula');
top_editor.session.setMode('ace/mode/text');

bottom_editor.setTheme('ace/theme/dracula');
bottom_editor.session.setMode('ace/mode/text');

let opts = {
    text: true,
    file_in_name: 'file.in',
    file_out_name: 'file.out',
    auto_file_refresh: true,
    auto_file_ref_rate: 500,
}

async function generateFiles() {
    if (fs.existsSync(path.join(master_path, 'nanachi'))) {
        master_path = await path.join(master_path, 'nanachi');
    } else {
        await fs.mkdirSync(path.join(master_path, 'nanachi'));
        master_path = await path.join(master_path, 'nanachi');
    }
    
    await fs.writeFileSync(path.join(master_path, 'build.sh'), `g++ ${path.join(master_path, 'main.cpp')} -o ${path.join(master_path, 'main')}`);
    await fs.writeFileSync(path.join(master_path, 'run.sh'), `${path.join(master_path, 'main')}`);
    await fs.writeFileSync(path.join(master_path, 'bar.sh'), `sh ${path.join(master_path, 'build.sh')} && sh ${path.join(master_path, 'run.sh')}`);
    await fs.writeFileSync(path.join(master_path, 'debug.sh'), `time sh ${path.join(master_path, 'bar.sh')}`);
    
    await fs.writeFileSync(path.join(master_path, 'term_run.sh'), `gnome-terminal -- bash -c "sh ${path.join(master_path, 'run.sh')}; read -p \"PAUSE...[ENTER]\""`);
    await fs.writeFileSync(path.join(master_path, 'term_bar.sh'), `gnome-terminal -- bash -c "sh ${path.join(master_path, 'bar.sh')}; read -p \"PAUSE...[ENTER]\""`);
    await fs.writeFileSync(path.join(master_path, 'term_debug.sh'), `gnome-terminal -- bash -c "sh ${path.join(master_path, 'debug.sh')}; read -p \"PAUSE...[ENTER]\""`);
}

function doTheIOFiles () {
    if (fs.existsSync('./' + opts.file_in_name)) {
        let content = fs.readFileSync('./' + opts.file_in_name,
            {encoding:'utf8', flag:'r'});
        top_editor.setValue(content);
        fileLastRunCont.in = content;
    } else {
        fs.writeFileSync('./' + opts.file_in_name, '');
        top_editor.setValue('');    
        fileLastRunCont.in = '';
    }

    if (fs.existsSync('./' + opts.file_out_name)) {
        let content = fs.readFileSync('./' + opts.file_out_name,
            {encoding:'utf8', flag:'r'});
        bottom_editor.setValue(content);
        fileLastRunCont.out = content;
    } else {
        fs.writeFileSync('./' + opts.file_out_name, '');
        bottom_editor.setValue('');
        fileLastRunCont.out = '';
    }

    document.getElementById('filename_1').innerHTML = opts.file_in_name;
    document.getElementById('filename_2').innerHTML = opts.file_out_name;
}

window.onload = function () {
    generateFiles();
    if ( ls.opts != undefined && Object.keys(JSON.parse(ls.opts)).length == Object.keys(opts).length ) opts = JSON.parse(ls.opts);
    if ( opts.text ) document.getElementById('rightCont').style.display = 'flex';
    else document.getElementById('rightCont').style.display = 'none';
    
    doTheIOFiles();
}

// Attempt at a crappy fix.. .?
setInterval(() => {
    if ( !opts.auto_file_refresh ) return;
    let content_in = fs.readFileSync('./' + opts.file_in_name, {encoding:'utf8', flag:'r'});
    let content_out = fs.readFileSync('./' + opts.file_out_name, {encoding:'utf8', flag:'r'});

    if ( content_in != fileLastRunCont.in ) {
        if ( top_editor.getValue() == fileLastRunCont.in ) {
            top_editor.setValue(content_in);
            fileLastRunCont.in = content_in;
        }
    }
    
    if ( content_out != fileLastRunCont.out ) {
        if ( bottom_editor.getValue() == fileLastRunCont.out ) {
            bottom_editor.setValue(content_out);
            fileLastRunCont.out = content_out;
        }
    }
}, opts.auto_file_ref_rate);

if ( ls.def_code == undefined ) {
    def_code = `#include <bits/stdc++.h>\nusing namespace std;\n\nint main () {\n    cout << "Watch Made in Abyss..." << endl;\n    return 0;\n}`;
    ls.def_code = def_code;
} else {
    def_code = ls.def_code;
}

if ( ls.last_code != undefined && USE_LAST_CODE ) def_code = ls.last_code;

if ( ls.last_code == undefined ) code = def_code;
else code = ls.last_code;

function inAndOutWrite () {
    fs.writeFileSync('./' + opts.file_in_name, top_editor.getValue());
    fs.writeFileSync('./' + opts.file_out_name, bottom_editor.getValue());
    fileLastRunCont.in = top_editor.getValue();
    fileLastRunCont.out = bottom_editor.getValue();
}

function inAndOutRead () {
    let content_in = fs.readFileSync('./' + opts.file_in_name,
            {encoding:'utf8', flag:'r'});
    top_editor.setValue(content_in);
    let content_out = fs.readFileSync('./' + opts.file_out_name,
            {encoding:'utf8', flag:'r'});
    bottom_editor.setValue(content_out);
}

function disableBtns () {
    for ( let i = 0; i < document.getElementsByClassName('fdisbtn').length; i += 1 ) {
        document.getElementsByClassName('fdisbtn')[i].disabled = true;
    }
}

function enableBtns () {
    for ( let i = 0; i < document.getElementsByClassName('fdisbtn').length; i += 1 ) {
        document.getElementsByClassName('fdisbtn')[i].disabled = false;
    }
}

function toggleText () {
    opts.text = !opts.text;
    if ( opts.text ) document.getElementById('rightCont').style.display = 'flex';
    else document.getElementById('rightCont').style.display = 'none';
    ls.opts = JSON.stringify(opts);
}

function newPrompt ( title ) {
    disableBtns();
    document.getElementById('prompt-cont').style.display = 'flex';
    document.getElementById('prompt-title').innerHTML = title;
    document.getElementById('prompt-input').value = '';
    document.getElementById('prompt-input').focus();
}

function returnPrompt () {
    let inpCont = document.getElementById('prompt-input').value;
    if ( inpCont != undefined && inpCont != '' ) {
        closePrompt(inpCont);
    }
}

function closePrompt ( inpCont ) {
    if ( fileTVar == 1 ) opts.file_in_name = inpCont;
    if ( fileTVar == 2 ) opts.file_out_name = inpCont;
    ls.opts = JSON.stringify(opts);
    doTheIOFiles();
    document.getElementById('prompt-cont').style.display = 'none';
    enableBtns();
}

function filenameIN() {
    fileTVar = 1;
    newPrompt('Input File Name');
}

function filenameOUT() {
    fileTVar = 2;
    newPrompt('Output File Name');
}

document.getElementById("prompt-input")
    .addEventListener("keyup", function(event) {
    event.preventDefault();
    if (event.keyCode === 13) {
        document.getElementById("prompt-enter").click();
    }
});

editor.setValue(def_code);
// top_editor.setValue('');
// bottom_editor.setValue('');

function buildCode () {
    inAndOutWrite();
    code = editor.getValue();
    ls.last_code = code;
    fs.writeFileSync(path.join(master_path, 'main.cpp'), code);
    disableBtns();
    build_cmd = spawn('sh', [path.join(master_path, 'build.sh')]);
    // BUILD
    build_cmd.stdout.on('data', (data) => { console.log(`stdout: ${data}`); });
    build_cmd.stderr.on('data', (data) => { console.error(`stderr: ${data}`); });
    build_cmd.on('close', (code) => { 
        console.log(`child process exited with code ${code}`);
        enableBtns();
    });
}

function runBuild () {
    inAndOutWrite();
    disableBtns();
    run_cmd = spawn('sh', [path.join(master_path, 'term_run.sh')]);
    // RUN
    run_cmd.stdout.on('data', (data) => { console.log(`stdout: ${data}`); });
    run_cmd.stderr.on('data', (data) => { console.error(`stderr: ${data}`); });
    run_cmd.on('close', (code) => { 
        console.log(`child process exited with code ${code}`); 
        enableBtns();
    });
}

function BAR() {
    inAndOutWrite();
    code = editor.getValue();
    ls.last_code = code;
    fs.writeFileSync(path.join(master_path, 'main.cpp'), code);
    disableBtns();
    bar_cmd = spawn('sh', [path.join(master_path, 'term_bar.sh')]);
    // BUILD
    bar_cmd.stdout.on('data', (data) => { console.log(`stdout: ${data}`); });
    bar_cmd.stderr.on('data', (data) => { console.error(`stderr: ${data}`); });
    bar_cmd.on('close', (code) => { 
        console.log(`child process exited with code ${code}`); 
        enableBtns();
    });
}

function runTimer () {
    inAndOutWrite();
    code = editor.getValue();
    ls.last_code = code;
    fs.writeFileSync(path.join(master_path, 'main.cpp'), code);
    disableBtns();
    run_timer = spawn('sh', [path.join(master_path, 'term_debug.sh')]);
    // BUILD
    run_timer.stdout.on('data', (data) => { console.log(`stdout: ${data}`); });
    run_timer.stderr.on('data', (data) => { console.error(`stderr: ${data}`); });
    run_timer.on('close', (code) => { 
        console.log(`child process exited with code ${code}`); 
        enableBtns();
    });
}