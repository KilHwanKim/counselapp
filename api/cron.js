function sayHello() {
    console.log("Hello, world!");
  }


const cron = require("node-cron");

cron.schedule("* * * * * *", function() {
  sayHello();
});