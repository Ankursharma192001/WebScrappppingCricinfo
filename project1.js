// purpose of this project

//the purpose of this project is to extract information of worldcup 2019 from cricinfo and present them
// in a form of pdf and excel sheet
//real purpose is to get experienced with javascript and have good fun with engaging it


//learning and getting familiar with javascript , some libraries and thier working

// read data from a source -->using axios;
// process data -->using jsdom;
//write processed data in excel--> using excel4node;
//create folders:one for each team--> using fs;


//TERMINAL COMMANDS
//npm init -y
//npm install minimist
//npm install axios
//npm install jsdom
//nppm install pdf-lib
//npm install excel4node


// node project1.js  --excel=worldcup.csv  --datafolder=data --source="https://www.espncricinfo.com/series/icc-cricket-world-cup-2019-1144415/match-results"
let minimist=require("minimist");
let axios=require("axios");
let pdf=require("pdf-lib");
let excel4node=require("excel4node");
let jsdom=require("jsdom");
let fs= require("fs");
let path=require("path");

let args=minimist(process.argv);

//console.log(args.excel);
//console.log(args.source);

//download using axios
//extract information using jsdom
//manupilate data using array functions
// save in excel using excel4node
//create folders and prepare pdfs;

let responseKaPromise=axios.get(args.source);
responseKaPromise.then(function(response)
{
    let html=response.data;
    //console.log(html);
    let dom=new jsdom.JSDOM(html);
    let document=dom.window.document;
    let matchDivs=document.querySelectorAll("div.match-score-block");
    let matches=[];
    for(let i=0;i<matchDivs.length;i++)
    {
        let matchdiv=matchDivs[i];
        let match={
            t1:"",
            t2:"",
            t1s:"",
            t2s:"",
            result:""
        }
        // --> this is how i got teams names  <--
        let teamsParas=matchdiv.querySelectorAll("div.name-detail > p.name");
        match.t1=teamsParas[0].textContent;
        match.t2=teamsParas[1].textContent;

        // --> this is how i got teams score <--
        let scoreSpans=matchdiv.querySelectorAll("div.score-detail > span.score");
        if(scoreSpans.length==2)
        {
          match.t1s=scoreSpans[0].textContent;
          match.t2s=scoreSpans[1].textContent;
        }
        else if(scoreSpans.length==1)
        {
            match.t1s=scoreSpans[0].textContent;
            // data for second team will be empty
        }
        else
        {
          //data for both team will be empty
        }



        // --> this is how i got result of the match <--
        let resultSpan=matchdiv.querySelector("div.status-text > span");
        match.result=resultSpan.textContent;
        matches.push(match);
    }
    //console.log(matches);
    let teams=[];
    for(let i=0;i<matches.length;i++)
    {
           putMissingTeaminArrayifMissing(teams,matches[i]);
    }
   for(let i=0;i<matches.length;i++)
    {
          putMatchinAppropriateTeam(teams,matches[i]);
    }
    let teamJSON=JSON.stringify(teams);
    fs.writeFileSync("teams.json",teamJSON,"utf-8");
    createExcelFile(teams);
    createTeamsFolders(teams);
    //console.log(teams);
    
});
function putMissingTeaminArrayifMissing(teams,match)
{
    let t1idx=-1;
    for(let i=0;i<teams.length;i++)
    {
        if(teams[i].name==match.t1)
        {
            t1idx=i;
            break;
        }
    }
    if(t1idx==-1)
    {
        team={
            name:match.t1,
            matches:[]
        };
        teams.push(team);
    }
    let t2idx=-1;
    for(let i=0;i<teams.length;i++)
    {
        if(teams[i].name==match.t2)
        {
            t2idx=i;
            break;
        }
    }
    if(t2idx==-1)
    {
        team={
            name:match.t2,
            matches:[]
        };
        teams.push(team);
    }
}

function putMatchinAppropriateTeam(teams,match)
{
    let t1idx=-1;
    for(let i=0;i<teams.length;i++)
    {
        if(teams[i].name==match.t1)
        {
            t1idx=i;
            break;
        }
    }
    let team1=teams[t1idx];
    team1.matches.push({
        vs:match.t2,
        selfScore:match.t1s,
        opponentScore:match.t2s,
        result:match.result
    });
    let t2idx=-1;
    for(let i=0;i<teams.length;i++)
    {
        if(teams[i].name==match.t2)
        {
            t2idx=i;
            break;
        }
    }
    let team2=teams[t2idx];
    team2.matches.push({
        vs:match.t1,
        selfScore:match.t2s,
        opponentScore:match.t1s,
        result:match.result

    })
}
function createExcelFile(teams){
    let wb=new excel4node.Workbook();
    for(let i=0;i<teams.length;i++)
    {
        let sheet=wb.addWorksheet(teams[i].name);
        sheet.cell(1,1).string("VS");
        sheet.cell(1,2).string("SelfScore");
        sheet.cell(1,3).string("OpponentScore");
        sheet.cell(1,4).string("Result");
        for(let j=0;j<teams[i].matches.length;j++)
        {   //console.log(teams[i].matches[j])
            sheet.cell(j+3,1).string(teams[i].matches[j].vs);
            sheet.cell(j+3,2).string(teams[i].matches[j].selfScore);
            sheet.cell(j+3,3).string(teams[i].matches[j].opponentScore);
            sheet.cell(j+3,4 ).string(teams[i].matches[j].result);
        }
    }
    wb.write(args.excel);

}
function createTeamsFolders(teams)
{
    fs.mkdirSync(args.datafolder);
    for(let i=0;i<teams.length;i++)
    {
        let teamFN=path.join(args.datafolder,teams[i].name);
        fs.mkdirSync(teamFN);
         let count=0;
         for(let j=0;j<teams[i].matches.length;j++){
         let matchFileName=path.join(teamFN,teams[i].matches[j].vs+count+".pdf");
         //console.log(matchFileName);
         createScoreCard(teams[i].name,teams[i].matches[j],matchFileName);
         count++;
        }
    }
}
function createScoreCard(teamName,match,matchFileName)
{
    let t1=teamName;
    let t2=match.vs;
    let t1s=match.selfScore;
    let t2s=match.opponentScore;
    let result=match.result;

    let bytesofpdftemplate=fs.readFileSync("Template1.pdf");
    let pdfdocKaPromise=pdf.PDFDocument.load(bytesofpdftemplate);
    pdfdocKaPromise.then(function(pdfdoc){
       let page=pdfdoc.getPage(0);

       page.drawText(t1,{
           x:320,
           y:533,
           size:16
       });
       page.drawText(t2,{
        x:320,
        y:490,
        size:16
    });
    page.drawText(t1s,{
        x:320,
        y:450,
        size:16
    });
    page.drawText(t2s,{
        x:320,
        y:410,
        size:16
    });
    page.drawText(result,{
        x:320,
        y:370,
        size:10
    });
    let finalpdfbyteskaPromise=pdfdoc.save();
    finalpdfbyteskaPromise.then(function(finalpdfbytes)
    {
        fs.writeFileSync(matchFileName,finalpdfbytes);
    });
    });
}