import "mocha";
import { expect } from "chai";
import chai from "chai";
import { URL } from 'whatwg-url';
import { MongoClient } from "../dist/mongodb.cjs";
import { MONGO_CLIENT_EVENTS } from 'mongodb/lib/constants.js'
import { myHello, constructMessage, parseMessage } from "../src/LaurelsSocket";
import { SocketWrapper } from '../src/ws';

chai.config.truncateThreshold = 0;

describe("All tests:",() => {
  describe("Unit Tests:", () => {
    describe("Unit test sanity checks", () => {
      it("3 should not equal 1", () => {
        expect(3).to.not.equal(1);
      });

      it("1 should equal 1", () => {
        expect(1).to.equal(1);
      });
    });

    describe('url sanity check', () => {
      const url = new URL("iLoveJS://127.0.0.1:9080");
      const options = { port: 9080, host: '127.0.0.1' }; //web socket connection

      it('the url port and host should be parsed correctly', () => {
        expect(parseInt(url.port)).to.equal(options.port);
        expect(url.hostname).to.equal(options.host);
      });
    });

    describe('verify that the simulated hello message is properly filled and formatted', () => {
      it('check that the helloOk field in the hello message does not change after converting bson to binary and back to bson', () => {
        expect(parseMessage(constructMessage(0,myHello())).doc.helloOk).to.equal(myHello().helloOk);
      });
    })
  })

  describe("Integration Tests:", () => {
    describe('Socket Sanity Check', () => {
      const ws = new SocketWrapper();
      it('the socket wrapper should use LaurelsSocket for testing', () => {
        expect(ws.socketMode).to.equal('test');
      });
    });

    describe('Client related tests', () => {
      let client;
      let events;

      beforeEach(() => {
        client = new MongoClient('mongodb://127.0.0.1:9080', { maxPoolSize: 2, serverSelectionTimeoutMS: 120000 });
        events = {};
        // console.log('adding event listeners');
        for (const eventName of MONGO_CLIENT_EVENTS) {
          client.on(eventName, event => {
            // console.log(new Date(), eventName, util.inspect(event, { colors: true, compact: true, breakLength: Infinity, depth: Infinity }))
            events[eventName] = events[eventName]?  events[eventName] + 1 : 1;
          })
        }
      })

      afterEach(async () => {
        await client?.close()
      })

      it('maxPoolSize should be 2', () => {
        // const { databases } = await client.db('admin').admin().listDatabases({ nameOnly: true });
        expect(client.options["maxPoolSize"]).to.equal(2);
      });


      it('client should not throw error when connecting', async () => {
        // client.connect().catch(() => null); // prevent it from throwing
        expect(await client.connect()).to.not.equal(null);
        // expect(events['connectionCreated']? events['connectionCreated'] : 0).to.equal(1);
      });

      it('the hello handshake is exchanged between node and simulated web socket', async() => {
        await client.db().command({ping:1});
        // console.log("events",events);
        expect(events).to.have.property('connectionCreated', 1);
        expect(events).to.have.property('serverHeartbeatSucceeded', 1);
      })
    });

    // describe('constructMessage() outputs the correct message', () => {
    //   it('should have helloOk be true', () => {
    //
    //   });
    // });
  })
})