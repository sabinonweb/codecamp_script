import { Octokit } from "octokit";
import csv from "csv-parser";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

const links = []

fs.createReadStream('CCSample.csv')
  .pipe(csv())
  .on('data', (row) => {
    const link = row['GitHub Repository Link'];
    if(link) {
      links.push(link)
    } 
  })
  .on('end', () => {
    console.log("Extracted Links: ", links)
    testUrl("github.com/sabinonweb/StudyBuddy")
  })
  .on('error', (err) => {
    console.error('Error reading CSV file: ', err)
  })

console.log("Links ", links)
console.log("Link ", links[1])


function testUrl(repoUrl) {
  console.log('Function Called')
  const repoUrlRegex = /^(https?:\/\/)?github\.com\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+$/;

  if (repoUrlRegex.test(repoUrl)) {
    console.log("RepoUrl ", repoUrl);
    getCommitHistory(repoUrl)
  } else {
    console.log("unmatched repoLink ", repoUrl);
  }
}

function getOwnerAndRepoName(repoUrl) {
  const url_array = repoUrl.split("/");
  if (url_array[0] === "https" && url_array.length >= 5) {
    return {ownerName: url_array[3], repoName: url_array[4]}
  } else {
    return {ownerName: url_array[1],repoName: url_array[2]}
  }
  return null
}

function isCommitWithinTimeWindow(commitDateStr) {
  const rangeStart = new Date('2024-12-05T09:30:00Z');
  const rangeEnd = new Date('2024-12-06T09:30:00Z');
  const commitDate = new Date(commitDateStr)

  return commitDate >= rangeStart && commitDate <= rangeEnd
}

async function getCommitHistory(repoUrl) {
  const url = `${repoUrl}/commits`
  const {ownerName, repoName} = getOwnerAndRepoName(repoUrl)

  console.log("OwnerName, reponame", ownerName, repoName)
  const auth_code = process.env.GITHUB_ACCESS_TOKEN

  const octokit = new Octokit({
    auth: auth_code
  })

  try {
    const response = await octokit.request("GET /repos/{owner}/{repo}/commits", {
      owner: ownerName,
      repo: repoName,
      headers: {
        'X-GitHub-Api-Version': '2022-11-28',
      }
    })
    
    const commits = response.data;
    const firstCommit = commits[commits.length - 1];
    const lastCommit = commits[0];
    console.log("first and last commits ", firstCommit.commit.author.date, lastCommit.commit.author.date); 

    // console.log("Commit Data", response.data)
  } catch (error) {
    console.error("Error fetching commit history: ", error);
  }
  
  console.log("url: ", url);
}
