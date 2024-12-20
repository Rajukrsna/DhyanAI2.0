const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const bodyParser = require('body-parser');
const expressLayouts = require('express-ejs-layouts');

const jwt = require('jsonwebtoken');
const session = require('express-session');
const flash = require('connect-flash');  // Import connect-flash
const cookieParser = require('cookie-parser');
const User = require('./models/User');
const { Issuer, generators } = require('openid-client');


require('dotenv').config();


const app = express();
app.use(cookieParser());
// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {

}).then(() => console.log("MongoDB connected"))
  .catch(err => console.error(err));

// Middleware
app.use(express.json());

app.use(bodyParser.urlencoded({ extended: true }));
app.use(expressLayouts);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use('/public', express.static(path.join(__dirname, 'public')));

// Session setup
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }   // Set to true in production with HTTPS
}));


app.use(flash());  // Must be placed after session and passport initialization

// Make flash messages available in all views
app.use((req, res, next) => {
  res.locals.success_message = req.flash('success');
  res.locals.error_message = req.flash('error');
  next();
});

// Import Routes
const habitRoutes = require('./routes/habits');
const nutritionRoutes = require('./routes/nutrition');

const dashboardRouter = require('./routes/dashboard'); 
const chatbotRoute = require('./routes/chatbot');  
const recommendYoga = require('./routes/yogas');
const pomo = require('./routes/pomodoro');


app.use('/habits', habitRoutes);
app.use('/nutrition', nutritionRoutes);
app.use('/dashboard', dashboardRouter);
app.use('/chatbot', chatbotRoute);  

app.use('/yogas' , recommendYoga);
app.use('/pomodoro', pomo);

let client;
async function initializeClient() {
    const issuer = await Issuer.discover(process.env.COGNITO_ISSUER_URL);
    client = new issuer.Client({
        client_id: process.env.CLIENT_ID,
        client_secret: process.env.CLIENT_SECRET,
        redirect_uris: [process.env.REDIRECT_URI],
        response_types: ['code']
    });
}
initializeClient().catch(console.error);

// Middleware to check authentication status
const checkAuth = (req, res, next) => {
    if (!req.session.userInfo) {
        req.isAuthenticated = false;
    } else {
        
        req.isAuthenticated = true;
    }
    next();
};

app.get('/', checkAuth, (req, res) => {
   // console.log("1", req.isAuthenticated)
  // console.log(req.session.userInfo)
    if (req.isAuthenticated) {
        // If user is authenticated, redirect to dashboard
        res.redirect('/dashboard');
    } else {
    -
        // If user is not authenticated, render the login page
        res.render('login');
    }
});

app.get('/login', (req, res) => {
    //console.log("Attempting login");
    // Generate new nonce and state
  // (console.log(req.session.userInfo))
    const nonce = generators.nonce();
    const state = generators.state();

    req.session.nonce = nonce;  // Set the nonce in session
    req.session.state = state;  // Set the state in session

    // Redirect to Cognito login page
    const authUrl = client.authorizationUrl({
        scope: 'openid email profile',
        state: state,
        nonce: nonce,
    });
    //console.log(authUrl);
    res.redirect(authUrl);  // Ensure redirection happens here
});

app.get('/callback', async (req, res) => {
    try {
        const params = client.callbackParams(req);
       // console.log('Callback params:', params);

        const tokenSet = await client.callback(
            process.env.REDIRECT_URI,
            params,
            {
                nonce: req.session.nonce,
                state: req.session.state
            }
        );

        const userInfo = await client.userinfo(tokenSet.access_token);
        req.session.userInfo = userInfo;

        // Debugging: Check the userInfo content
      //  console.log('UserInfo:', userInfo);

        const user = req.session.userInfo;
        
        // Check if user.sub is valid
        if (!user.sub) {
            throw new Error('User sub (ID) is missing in userInfo');
        }

        // Find the user by _id (user.sub)
        let user1 = await User.findOne({ _id: user.sub });

        if (!user1) {
            // If user does not exist, create a new user
            const newUser = new User({ 
                _id: user.sub,
                username: user.username, 
                email: user.email, 
            });
            
            await newUser.save();
            
           
            //console.log('New user created:', newUser);
        }

        // Generate JWT token
        const token = jwt.sign({ userId: user.sub }, process.env.JWT_SECRET, { expiresIn: '5h' });

        // Set token as a cookie
        res.cookie('authToken', token, {
            httpOnly: true,
            secure:false,
        });

        res.redirect('/');
    } catch (err) {
        console.error('Callback error:', err);
        res.redirect('/login');
    }
});

// Logout Route
app.get('/logout', (req, res) => {
  
    req.session.destroy();
// Clear cookies if you're using authentication tokens in cookies
res.clearCookie('authToken');
const logoutUrl = `https://us-east-1he7ntouvo.auth.us-east-1.amazoncognito.com/logout?client_id=70ibnsqdu15kbhcksmjg64n94d&logout_uri=${process.env.LOGOUT_URI}`;

        res.redirect(logoutUrl);
        // Redirect to login page after logout
    });
    


// Start the Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
