const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: '/auth/google/callback',
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const existingUser = await User.findOne({ email: profile.emails[0].value });
    if (existingUser) return done(null, existingUser);

    const newUser = new User({
      nome: profile.name.givenName,
      cognome: profile.name.familyName,
      email: profile.emails[0].value,
      avatar: profile.photos[0].value,
      dataDiNascita: new Date('1970-01-01'), // placeholder
      password: Math.random().toString(36), // placeholder password
    });

    await newUser.save();
    return done(null, newUser);
  } catch (err) {
    return done(err, null);
  }
}));

passport.serializeUser((user, done) => {
  done(null, user.id);
});
passport.deserializeUser(async (id, done) => {
  const user = await User.findById(id);
  done(null, user);
});
