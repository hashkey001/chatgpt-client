import Koa from 'koa'
import Router from 'koa-router'
import { replyMessage, resetConversation } from './chatgpt';

const app = new Koa();
const router = new Router()

router.post('/text/:contact', async (ctx) => {
    const query: any = await parsePostData(ctx)
    const content = query.say
    const { contact } = ctx.params
    console.log(`contact is ${contact}, content is ${content}`)
    const result = await replyMessage(content, contact)
    console.log(`result is ${result}`)
    ctx.status = 200
    ctx.body = {'result': result}
})

router.get('/reset/:contact', async (ctx) => {
    const contact = ctx.params.contact
    console.log('contact is : ' + contact)
    resetConversation(contact)
    ctx.status = 200
    ctx.body = 'success'
})

app.use(router.routes())

app.listen(3000);

function parsePostData(ctx) {
  return new Promise((resolve, reject) => {
    try {
      let postdata = "";
      ctx.req.addListener('data', (data) => {
        postdata += data
      })
      ctx.req.addListener("end",function(){
        let parseData = JSON.parse(postdata)
        resolve( parseData )
      })
    } catch ( err ) {
      reject(err)
    }
  })
}
