const { exec, fork } = require("child_process");
const ex = require('util').promisify(exec);
const express = require('express');
const app = express();
const path = require('path')
const history = require('connect-history-api-fallback');
require('dotenv').config({ path: './backend/.env' });
const inquirer = require('inquirer');
const ora = require('ora');
const envfile = require('envfile');
const staticFileMiddleware = express.static(path.join(__dirname, 'dist'));
const fs = require('fs');
const spinner = ora({ text: 'Building app..', spinner: 'dots', color: 'red' })



if (!process.env.MONGO_URI) {
    inquirer.prompt([
        {
            type: 'input',
            name: 'MongoDB',
            message: 'Please provide a mongodb link (learn more @ https://tovy.gitbook.io/tovy/hosting/creating-a-mongodb-database)',
            validatingText: 'Checking URI',
            validate: async (answer) => {
                console.log(answer)
                if (!answer.includes('mongodb+srv://')) return 'Please enter a valid mongodb srv URI '
                return true
            },
        },
        {
            type: 'input',
            name: 'port',
            message: 'If you would like to run tovy on a custom port please enter that port below!',
            default: 8080
        }
    ]).then(answers => {
        const envobj = {
            MONGO_URI: answers.MongoDB,
            PORT: answers.port || 8080
        }
        fs.writeFile('./backend/.env', envfile.stringify(envobj), (err) => {
            if (err) throw err;
            console.log('The file has been saved!');
            runBuild();
        })
    })
} else {
    runBuild();
}



function runBuild() {
    spinner.start();

    let chield = ex('npm run build').then(async (result) => {
        setTimeout(() => {
            startbackend();
        }, 1000)
        spinner.stop();
        console.log(` 
████████╗░█████╗░██╗░░░██╗██╗░░░██╗
╚══██╔══╝██╔══██╗██║░░░██║╚██╗░██╔╝
░░░██║░░░██║░░██║╚██╗░██╔╝░╚████╔╝░
░░░██║░░░██║░░██║░╚████╔╝░░░╚██╔╝░░
░░░██║░░░╚█████╔╝░░╚██╔╝░░░░░██║░░░
░░░╚═╝░░░░╚════╝░░░░╚═╝░░░░░░╚═╝░░░`)
        console.log(`Tovy has been successfully built`)
    });

}

function startbackend() {
    const child = fork('./backend/index.js', []);
    child.on('error', message => {
        console.log('message from child:', message);
    });
    child.on('close',(code) => {
        console.log(`child process exited with ${code}`);
        startbackend();
    })
}

