const express = require('express');
const app = express();
const cors=require("cors")
require('./db/config');
const User=require("./db/User");
const Product=require("./db/product")

const Jwt = require("jsonwebtoken")
//we can hide this key using env file.
const jwtKey='e-comm'

app.use(express.json());
app.use(cors());

app.post("/register",async (req,res)=>{
    let user=new User(req.body);
    let result=await user.save();
    result=result.toObject();
    delete result.password
    // res.send(result);
    Jwt.sign({result},jwtKey,{expiresIn:"2h"},(err,token)=>{
        if(err){
            res.send({result:"somethign went wrong,please try after sometime..."})
        }
        res.send({result,auth:token})
    })
})

app.post("/login",async (req,res)=>{
    // res.send(req.body)
    if(req.body.password && req.body.email){
        let user=await User.findOne(req.body).select("-password");
        if(user){
            Jwt.sign({user}, jwtKey, {expiresIn:"2h"},(err,token)=>{
                if(err){
                    res.send({result:"something went wrong, please try after some time..."})
                }
                res.send({user,auth:token})
            })
        }
        else{
            res.send({result:'No User Found'})
        }
    }else{
        res.send({result:'No User Found'})
    }
});

app.post("/add-product",verifyToken, async (req,res)=>{
    let product = new Product(req.body);
    let result = await product.save();
    res.send(result)
})

app.get("/Products",verifyToken, async (req,res)=>{
    let products=await Product.find();
    if(products.length>0){
        res.send(products)
    }
    else{
        res.send({result:"No Products found"})
    }
})

app.delete("/product/:id",verifyToken,async (req,res)=>{
    // res.send(req.params.id)
    const result =await Product.deleteOne({_id:req.params.id})
    res.send(result);
});

app.get("/product/:id",verifyToken, async(req,res)=>{
    let result = await Product.findOne({_id:req.params.id});
    if(result){
        res.send(result)
    }
    else{
        res.send({result:"No record found"})
    }
    
})

app.put("/product/:id",verifyToken, async(req,res)=>{
    let result = await Product.updateOne(
        {_id: req.params.id},
        {
            $set: req.body
        }
    )
    res.send(result)
});

app.get("/search/:key",verifyToken,async(req,res)=>{
    let result=await Product.find({
        "$or":[
            {name:{$regex: req.params.key}},
            {company:{$regex: req.params.key}},
            {category:{$regex: req.params.key}}
        ]
    });
    res.send(result)
})

function verifyToken(req,resp,next){
    let token = req.headers['authorization'];
    // console.warn("middleware called")
    if(token){
        token=token.split(' ')[1];
        Jwt.verify(token, jwtKey, (err,valid)=>{
            if(err){
                resp.status(401).send({result: "please provide valid token "})
            }
            else{
                next();
            }
        })
    }
    else{
        resp.status(403).send({result : "please add token with header"})
    }
    // next();
}

app.listen(5000,()=>{
    console.log("sever started")
});

