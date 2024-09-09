import React, {Component, KeyboardEvent} from "react";
import { isRecord } from './record';
import "./style.css"

type Message = {sender: string, content: string, timestamp: string}
//Represents the state data of the chat application
type ChatAppState = {
  messages: Message[] | undefined;
}

/** Displays the UI of the chat application. */
export class ChatApp extends Component<{}, ChatAppState> {

  constructor(props: {}) {
    super(props);

    this.state = {messages: []}; //Initializes the app to show an empty screen.
  }

  /* The following methods are rendering methods that return the HTML corresponding to the page*/

  render = (): JSX.Element => { //Renders the correct HTML for the page
    return (
      <div>
        <div className="ChatWindow">
        {this.renderMessages()}
        </div>
        <div className="ChatInput is-hidey"><div className="ChatInput-input" contentEditable="true" placeholder="Type your message here..." onKeyUp={this.doKeyUp}></div></div>
      </div>
      );
  };

  renderMessages = (): JSX.Element => { //Renders the HTML for the messages
    const messageContainer: JSX.Element[] = []
    if(typeof this.state.messages === "undefined"){
      return (<div></div>)
    }

    for(const message of this.state.messages){
      if (message.sender === "Assistant") {
        messageContainer.push(
          <div className="ChatItem ChatItem--expert">
            <div className="ChatItem-meta">
              <div className="ChatItem-avatar">
                <img className="ChatItem-avatarImage" src="https://image.ibb.co/eTiXWa/avatarrobot.png"></img>
              </div>
            </div>
            <div className="ChatItem-chatContent">
              <div className="ChatItem-chatText"> {message.content} </div>
              <div className="ChatItem-timeStamp"><strong>Assistant</strong> · {message.timestamp} </div>
            </div>
          </div>
        );
      } else {
        messageContainer.push(
          <div className="ChatItem ChatItem--customer">
            <div className="ChatItem-meta">
              <div className="ChatItem-avatar">
                <img className="ChatItem-avatarImage" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAJgAAACUCAMAAABY3hBoAAAAn1BMVEUVfqv////v7+/u7u76+vry8vLs6+v39/fl4+Pw7ewAfK0AeKno5+YAeqkAdacAcaMAa55HfJ3z+PoAapjDycyJnav9+PXe2tj28u/e3+CbrbgAcJ3W2dsAaJIAcKVnjKMocJawusGosLYAY5Rahqaltb+XpbKqwdLNzc6En7Fwj6wteqJCgKZ6mbOPp7a6vsB1lKdSgJpnlbRqhpc3bYxon0R5AAAOd0lEQVR4nL1c6YKquBIWsimrjGiLYAPd6ujYx2Wm3//ZbhYCYVNC27f6/IAjJB+VSi1JVSYGJ2QyQuIGsGsA+TXkN2bxFFCe4v9vdjxF2A0gylOyLVNti/+AOp4SbU3kY9jEoATGbuRjAANcAsMAlI0B9pN8iv0ggfHXJTCgtMVfKYEpPZq1HtldBeynHAOv4xhWOEbMZpc1YKjjKaQAMxCEkBTXECnA0ENgZhf8YighIwNjBzsORpzYpeOY/Np02E9Y3IinQPkUHWQC17PoGO73h8N+//ff+/0+DI/RbLZGhL/OWsVlW+wdR7wO+E3RI+sQY9EwYQ8DNKmNSPuTkPoDUW74D85xc/pnd47j2Pc9z/MZ0Zuv3Z/LNZmtDIRguy2V1aTdY8G4SQcXnwuUSdYgCm9B7Nuu605a5Lq272f3TTglzwSK39SAGRIYFVw9YAiuj8tdPLetNiSVLH8R3HJHtqUNrKYb2OySwNhNpRvoTTEuyS3wrQ4+dYLzFmkO1kQFxpqq9QjUHitg9ZmKK2DsRlFaApjzcV/Yw0BJbPPgT7iGpqoAQa3HbmAYgKEyZsDotLAH8qo+qEGOUa9uAGqPEhhXF5CImSpukHIjfkBcpxjHU+zpo5LQPtZG2daDHsU1kpqfs1dqflBjojQ2SeqPYFZJrr39AMgElQgDs6tHxHsEg02Sc4r1RKuD/OBK0DOTRLDQ/PIxgBUjrppn9gMhm5/DYlzz0qS0VayTyoiXPVJglH0lMFXSAahzDMFj6r8AFiM7PqzLKagMZY1jKjCsyhhW57OJ8Cb+iXA1yAuSdo+KBiGY+1MT0k2ovILJ/f11sChZiw2BjU6UGyQuJqCm7jjVJ2q+fWJ59Mm7T1Fvj92av6lgCT7NX46LIsuOhtJjn63EJcdwDT8V++l9rEZ9TFa87+QYNntspckmbvkYTIJXKIlO8i+w3WONY1zRqq57+RgJsxfOxiZ5KWz1CJjlLoAhEzFNJW0W82sNYcxgHv8eLI4MGYR50ZX5ZNemuOkySYUrEf7INA4gO5Dxi+qHkkZc2bSVMF/8LiyGLAVKjz220qzcVa4nwsUv84uRd5ccq/z7lhFXDATFdf1d+SqRpUQAwyUw1LCVtaEk09er+27yD7xHXA0lqnMMKE4IQNH5/4RrMnm/GMKI44YRR20X14D3X9OrbYpDWPO2HYGl01Yuf8cOdZO1LX1H3v20NxInv6xYW8h2M1VnOSUwrC5z0RkQbbWb9uMs+8pif5xkejfJMQxUYA0/ep1qCpj1/r1PoghH4eG+fX+2btBF86PkGAVQLHdM6n40AOSiKWA09FkZktbHw+7saavmzJGqAZhOAazhUsPpp1aT1uJgGjVaJ4dsrsl0+2SUABxTuNaVHuOan9y1hsK+R0YHJZezHrTPI5HDNnM6A95cayDf77MuXJSi26fWFwYYSWCdAa+51ZEPb9kDi5Gj5ZXbG1IBU20lt+/IuOgEtn4KHwAzkFaUvJWB06wZ8NJbkpw1mnLv60e4KOlYEG9JShljXFKWoUxETjoiG4dPcBlERyXGR6NYQOdYagFvomOLvMszXPTrNaIZ+yT0mFSwqua/6YjrFj8HZmw0xCxOuG6ogJUci3Qk7OGMLMn50mDZEjKT5JTAsAS20WHYcwnjdNLQZucpAmbHUIKzjg47TwcBC+fDm7Q3bCydyohjjBmwq9biXGA+RlQQ0jC91p2Jv+RY8b5prrSspJWuHsCpCH5rtOoz94frMSUYQUctv3UoMEPnc+2UvmDWgZloo+UPuCkZBmynI7jZuhW+mUirhYm7GwhMS0DsayvgRYnmUsUO/QIw9wSF2wNKYGSv6VEPnJVQa4nNpa0iddUaEb0vo/TlDAJG9EKu+AgBW9KGRCrYmW4seU4GAUv0QgjvAusBrxHqBt8DTZKmhLh3BRjf4dVTFpT8vwcBu+lJiJXNcAmM+a7oX91Y0N8PwbVKNUXXC2cSGNvhNXGgiWty7ozbWqS7PmPvi7irWIaKdBdc3z8G4TKmmg27J0DUVetEwzvhNH8bBgxqrtC4/4ptORnwfujuRxbrIE+J6KkLqridmq3UnDxUSIcOpS6wRQRUW6k7eSbWIJffMHLdvc55ghRgK+21Onf3LNoVtNT9Yv+DZbVgCUx/cXOYSVrfdfUjjciF8IvFMn1g3mYIsFC7YSsVbwpbiUcsn28HsIwE2ouLCjCWJzAie8EeIP5XXfXIQqUasBEck5/2iJb67bqBMpQIj9lxeO4qru8jmpXA2Kq16YwB5j71yLQWQ5rAuMX8a8zekX17BuwyZoslWClpWqOATbIn8QgJxuyUBGtl1fqvUbta7/ljYLn+nBTAKiM+DpgVPF4m2I3aWuIc+xkw6m4+ZNgo+bDuK5Vj49LD3Kxv/4ESGJdNYqVic1LMSu2osiD7wQKx1gq4AuwmUiwLIz5G4TDqjy719n4q8g7ifWHE1/rGVpCb9QRLmhF4RfOrCkw7/CvJ7t7mckapMEaLRALjq+kjrK1EtuswmdFoXJNsWgJj5QrjdKFA1ubZD9LO3KDcE2dL2CgaC8x2J3ZQD+XgPnYnYxODrD9y7aLgvXY0IpqJ95Q5VrxRmMZzZr1sZIaqe6qnaZnaQQPHtQ0NnFK9YJ8/IgKNFQFhytgVX1CouflckJ3DWsBLTiOAidxMslxQSffj9LZc7s4s19/LmHZL0jFpGH5UBwb32t9nx7diPoYBS2iwbJun+tv2TUwseA20Ex2sjOWP4SoSJ4nuctEirUTe3O8WHmOPa/vbZfX/eJNpcs1Om4lt60zjddc+p0ltP5yEh/s5y+7/hfVdTBAGsU7JhLcXwGgkXqRpaSyr2PNg2bn1tu50z6abuz9YThYJketjcut54N6ba8fpdeDeQ8nO5BZ3VS91tL6jzBIvlfuVYIjied+m+cAVuwbb9tmQnG22Y4nrq9YGfO4/eUFuDtxBahNK0vgpNO+oAit2eK9PgFnZfjQqQdHuibhY39StlsCArEt6Mi/tYNhe8yNCm8eesr+hbnWhHCdl7cHjlW83feDeD6f8oascRxTHjDTStNDx0cr3wL35p/RIkm2eK0Rqq9bc90n756U/aJluAD2KLmweQLRzrUl//OAO3J0cQP25K0X83ASGWUjSN58fR7ZahHrDTT83CmCNgikAe78mfpGEMbr0SJkVIAmM1XDXqgVnPSyzni44aVBfypWXi8oLJCqRa8XFfdue82GbpsNo1bPM+DUTlcYtzU8JzrpzHLIfqvw6fXRulszzIoOzMuJVjj8kncvM9u1hLqIuOV1BunsnYgbWjHiVOUy6dNnzxVYt6lz8j4/F8QTdQ9md4ROP8nT6qSPw4eu5jaHEanG0CdsSYN0H5hcNpbAFzM0YAJHPLznWKPWlCrCpMl6qLBi1FYafk7JsCpj14mJT1oe2cmH914oYpV1rIFfmg7okWWWzaQzmYlhOigY1Fr2sLEJmX5WNWlzcKGV5rRZj1NDjcUjMqjIQ9RcX13da3PtLtRijekbl+5IXTJk9BVNKJRepuYyPFoBHklNrPy3qkrAEVisu5nWLsgqh5jTZ+cuBEcX1sYIpy8qif0X3APHrdvkPr7xU0udfrPd5P9Wil3WOCKhVpPZV2ZiiuFipEnj5pFQ9f5bJVi8uVtK0cP30CQ5sVma8vyoMUalMCvNDfkRHAYzXJfVXcgn3nsgF3q9hCRZalBdDudizk2NwxTGWNi+B1YqLQfUYLnh2fz0u4yqALUKDnyehFBdXSeDCk5XFxeoN4DyzfgNYIuRrb8DqnI+yWhDViovVY2LkWQpi3XdgEo8WsejSja9EOf+llKdGrrViK6tS3/XNp4r/F4R/H1MDSeW+6yCOZl0Sk7vqII7CqYWXeGJnA1PFBhO40Vap/lJPCKmKi1sFU2pxcVXfkseWFW9eai2Tb3/ip1MCeoH1Fhcrpb7GMbNpM8MyJYcQyakn6h8g4Qqgo8dGrnWtuFg98ow4f/yJvd28SJsl6ZwKR9hx7g2uhJ8bcTXgheoUqA4by8/uxN69wmSay9ideGlEUO/5XairLql97pD4pCn9TGtx+vF45plH2bVfoUcnHSl1ScpjjUOrJPtIfrYn7rl7eX8oXQPXtfwbRg9ZoQDDikliB+2pJ+3JcYXTC50EXnYZy7VVyPa85kEolFbPmSS4p8Ss8seMhjEwEUlSz7K88/I4QneYH7vYot+1Z82xVSbQ2WOzuBjXTx1U8GNcHc2FVuE/sW1Zn/e93oiuj8vsnaqI4ABkW3TalT3iqkescgwSYT/5n7hhoS8qbuQPvMKQHP+j+tbyz7e3obs2cPpxjz3LtbMDNohoF8oelRtUdo8B/6nTiLdGV4odgW+nL8+aWPPtLY+eqTY4Cy/3T8osO07zVbOtLreB0RAjbhito3wQmubB3HInrnfe3fK3XoFbHw9pQIeePrhditMGhh3w2F1cXACrn6alHInJXiHG20cas60+y/vcBqdNHiaRM1uvIFzNnChK8v0p/f6c265l2XFwukrOQq4BKm1E/fiOIzE7iotVjoHOoSzDYhLtb9sFlR3atx275ywIdoyCIDufXdt2XbbbuwgOobMmstAamsrBmbXTtFQN8sCIm4pJhRhX7Cd8t1rK/Xqan3ZBPPfpVKXc4zThV958nu1um3BdGDbVc+88ErMpY6AsLmaljPwANEa8sBGLHSY2helNEYuqTwGM0Aw7UXhd3r+3i8ViTmmxiLPv/w50bDE/vpPwN6q2cKMts+ix+gEWB3OKHd7imExzykl4/phfO7wEufgBK0855SmbM7RerWZMBzlT+kdljbny5esmO6RT3Ij+p29T+k/cOG+cxA/8cip33/rCt44DT/t9kGJExLmhHU/Vxo1/aqFTjeKwFOV1UgLTPhLz5cfl1iJxpADDLwKGcC8wrJ60VwOmxJWmcgjn/wDVEu8lOtCg6AAAAABJRU5ErkJggg=="></img>
              </div>
            </div>
            <div className="ChatItem-chatContent">
              <div className="ChatItem-chatText"> {message.content} </div>
              <div className="ChatItem-timeStamp"><strong>Me</strong> · {message.timestamp} </div>
            </div>
          </div>
        );
      }
    }
    return (<div>{messageContainer}</div>);
  }

  /*Add an user message to the history*/
  doKeyUp = (e:KeyboardEvent<HTMLInputElement>):void =>{
    if (e.shiftKey && e.which === 13){
      e.preventDefault();
      return;
    }
    if (e.which === 13){
      const text:string = e.currentTarget.innerText;
      const message1:Message = {sender: "User", content: text, timestamp: new Date().toUTCString()}
      const newMessages = this.state.messages?.concat([message1])
      this.setState({messages: newMessages})
      this.doQuerySubmitted(text)
    }
  }



  /*Get chatbot response: GET Request*/

  doQuerySubmitted = (query:string):void => { //Update the message history with the chatbot's response
    fetch("/api/respond?prompt=" + query) //Attemt to fetch the response
      .then(this.doQueryResp) //Server gave a response
      .catch(() => this.doQueryError("Failed to connect to server")); //Server did not give a response
  }

  doQueryResp = (res: Response):void => { //Reads and acts on the server response
    if(res.status === 200){ //The error code suggests that there is no error
      res.json() //Convert the response to JSON
         .then(this.doQueryJson) //Do something with the JSON
         .catch(() => this.doQueryError("200 response is not JSON")) //The response could not be converted to JSON
    } else {
      this.doQueryError(`bad status code ${res.status}`); //This is a error code we did not expect from the server
    }
  }

  doQueryJson = (data: unknown):void => {//Do something with the JSON data returned by the server
    if(!isRecord(data)){ //For non-error cases, server should always give us a record. If this did not happen, something went wrong
      this.doQueryError(`200 response is not a record. \nResponse: ${data}`);
      return;
    }

    if(typeof data.response !== "string"){
      this.doQueryError(`Expected model response to be string but was instead ${typeof data.response}`)
      return;
    }

    //At this point, we know that we have successfully retrieved a valid model response
    const message2:Message = {sender:"Assistant", content: data.response, timestamp: new Date().toUTCString()}
    const newMessages = this.state.messages?.concat([message2])
    this.setState({messages: newMessages})
  }

  doQueryError = (msg: string):void => { //Relay an error message to the user
    console.error(`Error fetching /api/respond: ${msg}`);
  }
}
