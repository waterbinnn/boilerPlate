//필요한 모듈
const express = require("express");
const app = express();
const cookieParser = require('cookie-parser');
const {auth} = require('./middleware/auth')

//몽고디비 연결 호스트 설정
const config = require("./config/key");
const { User } = require("./models/User");

//application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));
//application/json
app.use(express.json());
app.use(cookieParser());

//몽고디비 연결
const mongoose = require("mongoose");
mongoose
  .connect(config.mongoURI, {
    // useNewUrlParser: true,
    // useUnifiedTopology: true,
    // useCreateIndex: true,
    // useFindAndModify: false,
  })
  //성공시
  .then(() => console.log("MongoDB Connected..."))
  //실패시
  .catch((err) => console.log(err));

app.get("/", (req, res) => {
  res.send("Good");
});

app.get("/api/hello",(req,res)=> {
  res.send('안녕하세요~')
})

app.post("/api/users/register", (req, res) => {
  //회원가입할때 필요한 정보들을 client에서 가져오면
  const user = new User(req.body);
  
  // user 데이터 베이스에 넣어준다
  //save 하기 전에 비밀번호를 암호화 해줘야한다
  user.save((err, doc) => {
    if (err) return res.json({ success: false, err });
    return res.status(200).json({
      success: true,
    });
  });
});


app.post('/api/users/login',(req,res)=>{

  //요청된 이메일을 데이터 베이스에서 있는지 찾기 
  User.findOne({email:req.body.email},(err,user)=> {
    if(!user){
      return res.json({
        loginSuccess: false,
        message:'제공된 이메일에 해당하는 유저가 없습니다.'
      })
    }
    //요청된 이메일이 데이터 베이스에 있다면 비밀번호가 맞는 비밀번호인지 확인
    user.comparePassword(req.body.password, (err,isMatch) => {
      if(!isMatch)
      return res.json({ loginSuccess: false, message:'비밀번호가 틀렸습니다.'})
      
    })
    //비밀번호까지 맞다면 토큰 형성
    user.generateToken((err, user)=> {
      if(err) return res.status(400).send(err);
      
      //토큰을 저장한다. 어디에? 쿠키 or 로컬스토리지 등 내가 정할 수 있음 여기선 쿠키에 하겠슴 (쿠키에 하려면 라이브러리 깔아야함 )
      
      res.cookie("x_auth", user.token)
      .status(200)
      .json({loginSuccess: true, userId:user._id})
      
    })
  })
})

app.get('/api/users/auth', auth ,(req,res)=> {
 //여기까지 미들웨어를 통과해 왔다는 얘기는 Authentication 이 true 라는 말
 res.status(200).json({
  //유저정보제공
  _id: req.user.id,
  isAdmin: req.user.role === 0 ? false : true,
  isauth: true,
  email: req.user.email,
  name: req.user.name,
  lastname: req.user.lastname,
  role: req.user.role,
  image: req.user.image,
 })
})

app.get('/api/users/logout', auth, (req,res)=> {
  
  User.findOneAndUpdate({_id:req.user._id},
    {token:""}
    , (err,user) => {
      if(err) return res.json({success:false,err});
      return res.status(200).send({
        success:true
      })
    })
})


const port = 5000;

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});


