:airplane: paperplane

Ridiculously simple & free backend  for your web forms. Powered by the [JAWS Framework](https://github.com/jaws-framework/JAWS).

Just connect your web form to our API endpoint, and we'll email you form submissions as they happen. **If this is the first time you POST to our API with this email address, you'll need to verify your email first.** So submit the form at least once to receive the verification email. After your email is verified, you'll be able to receive form submissions!

```javascript
$.ajax({
  type: "POST",
  url: "paperplane.eahefnawy.com",
  data: { 
    email: "your@email.com", // your email
    payload: { // Example form data. Get it dynamically from the user!
      "first_name" : "Sam",
      "last_name"  : "Smith",
      "email"      : "sam@smith.com",
      "message"    : "Hello from PaperPlane!"
    }
  },
  success: function(response) {
    console.log(response);
  },
  dataType: "json"
});
```

### Be Creative
You can use paperplane for any type of web forms, from simple contact forms to long surveys. You can be even more creative and use it to deliver any type of JSON data right to your mailbox, such as your users' activity on your website or items they want to order. Heck, you can even use it with Node.js, Python, Ruby and curl! It's just an HTTP request. Sky is the limit!

### Tech Stack
This project is powered by [AWS](https://aws.amazon.com), [SES](https://aws.amazon.com/ses/), [JAWS](https://github.com/jaws-framework/JAWS) & [AWSM](https://github.com/awsm-org/awsm). That means that it's scalable and reliable indefinitely!
