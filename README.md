## Notice
**The Feedient repositories (Feedient/Client, Feedient/Server & Feedient/Vagrant) are the remnants of the feedient.com service which shut down on March 30th, 2015. No guarantees are given for any functionality – the features rely on third party API's from the social networks, which may have changed. There are various places where API tokens need to be filled in, for the web app to work.**

**As we do not have any plan of re-opening, and the project was just gathering dust, we decided to release all code and assets to the public. We do not have any intention of maintaining the repositories – they serve mainly as historic evidence. Feel free to use any code or design in any way you wish.**

*Original private repository readme follows below:*

---

![Feedient](http://i44.tinypic.com/350o5y8.png)
#### Server side
## Version Dependencies
- Node.js >= v0.10.30

## Updating npm packages
1. Run: `sudo npm install -g npm-check-updates`
2. Run: npm-check-updates

## Installation
1. Install the [Vagrant box](https://github.com/thebillkidy/ProjectFeeds-Vagrant)
2. Clone this repository as `api.feedient.com` to the www dir in vagrant `git clone git@github.com:thebillkidy/Feedient-Server.git api.feedient.com`
3. Start vagrant: `$ vagrant up`
4. SSH into the vagrant box: `$ vagrant ssh`
