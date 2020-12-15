#!/usr/bin/env sh
set -e
yarn build
cd public/
git init
git add -A
git commit -m 'deploy'
git remote add origin git@gitee.com:leisji/leisiji-blog.git
git push origin master:master -f
cd -
