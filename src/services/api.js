import { stringify } from 'qs';
import request from '@/utils/request';
import Octokit from '@octokit/rest'
import config from './config.json'

const octokit = Octokit()

let githubToken
try {
  githubToken = localStorage.getItem('github_token');
  if (!githubToken) {
    githubToken = window.prompt('Please input github token(store in local storage):');
    if (githubToken !== null) {
      localStorage.setItem('github_token', githubToken);
    } else {
      window.alert('Please input valid github token!')
    }
  }
} catch (error) {
  console.error(error)
}

octokit.authenticate({
  type: 'token',
  token: githubToken
})

export async function getPRsByMilestone () {
  const resultObj = {}
  const resultArr = []
  for (const e of config) {
    resultObj[e.name] = (await octokit.issues.listForRepo({
      owner: e.owner,
      repo: e.repo,
      state: e.state,
      milestone: e.milestone,
      per_page: e.per_page
    })).data
  }
  Object.keys(resultObj).forEach(objKey => {
    resultArr.push(...resultObj[objKey])
  })
  return resultArr
}

export function getAllComments (PRs) {
  const result = []
  const reviewers = []
  let count = 0
  const PRsLength = PRs.length
  return new Promise((resolve, reject) => {
    for (const repoPR of PRs) {
      const repositoryUrl = repoPR.repository_url.split('/')
      const PRConfig = {
        owner: repositoryUrl[repositoryUrl.length - 2],
        repo: repositoryUrl[repositoryUrl.length - 1],
        number: repoPR.number
      }
      Promise.all([
        octokit.pulls.listComments(PRConfig),
        octokit.pulls.get(PRConfig),
        octokit.pulls.listReviews(PRConfig)
      ]).then(res => {
        const {data} = res[0]
        const author = res[1].data.user.login
        const listReviewsData = res[2].data
        listReviewsData
          .filter(v => v.user.login !== author)
          .forEach(v => {
            const reviewer = reviewers.find(user => user.name === v.user.login)
            if (reviewer) {
              v.state === 'COMMENTED' && reviewer.commentedCount++
              v.state === 'APPROVED' && reviewer.approvedCount++
            } else {
              reviewers.push({
                name: v.user.login,
                commentedCount: v.state === 'COMMENTED' ? 1 : 0,
                approvedCount: v.state === 'APPROVED' ? 1 : 0,
              })
            }
          })
        data.length && data.forEach(v => {
          result.push({comment: v.body, prUrl: v._links.html.href, prNo: v.pull_request_url.split('/')[v.pull_request_url.split('/').length - 1]})
        });
        count++
        if (count === PRsLength) {
          resolve({
            reviewers,
            result
          })
        }
      })
    }
  })
}

export async function queryProjectNotice() {
  return request('/api/project/notice');
}

export async function queryActivities() {
  return request('/api/activities');
}

export async function queryRule(params) {
  return request(`/api/rule?${stringify(params)}`);
}

export async function removeRule(params) {
  return request('/api/rule', {
    method: 'POST',
    body: {
      ...params,
      method: 'delete',
    },
  });
}

export async function addRule(params) {
  return request('/api/rule', {
    method: 'POST',
    body: {
      ...params,
      method: 'post',
    },
  });
}

export async function updateRule(params = {}) {
  return request(`/api/rule?${stringify(params.query)}`, {
    method: 'POST',
    body: {
      ...params.body,
      method: 'update',
    },
  });
}

export async function fakeSubmitForm(params) {
  return request('/api/forms', {
    method: 'POST',
    body: params,
  });
}

export async function fakeChartData() {
  return request('/api/fake_chart_data');
}

export async function queryTags() {
  return request('/api/tags');
}

export async function queryBasicProfile(id) {
  return request(`/api/profile/basic?id=${id}`);
}

export async function queryAdvancedProfile() {
  return request('/api/profile/advanced');
}

export async function queryFakeList(params) {
  return request(`/api/fake_list?${stringify(params)}`);
}

export async function removeFakeList(params) {
  const { count = 5, ...restParams } = params;
  return request(`/api/fake_list?count=${count}`, {
    method: 'POST',
    body: {
      ...restParams,
      method: 'delete',
    },
  });
}

export async function addFakeList(params) {
  const { count = 5, ...restParams } = params;
  return request(`/api/fake_list?count=${count}`, {
    method: 'POST',
    body: {
      ...restParams,
      method: 'post',
    },
  });
}

export async function updateFakeList(params) {
  const { count = 5, ...restParams } = params;
  return request(`/api/fake_list?count=${count}`, {
    method: 'POST',
    body: {
      ...restParams,
      method: 'update',
    },
  });
}

export async function fakeAccountLogin(params) {
  return request('/api/login/account', {
    method: 'POST',
    body: params,
  });
}

export async function fakeRegister(params) {
  return request('/api/register', {
    method: 'POST',
    body: params,
  });
}

export async function queryNotices(params = {}) {
  return request(`/api/notices?${stringify(params)}`);
}

export async function getFakeCaptcha(mobile) {
  return request(`/api/captcha?mobile=${mobile}`);
}
