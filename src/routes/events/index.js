import axios from 'axios';
import Router from 'koa-router';

const eventsURL = 'https://lego.abakus.no/api/v1/events?date_after=2023-04-30';

let eventsCache;

const dateString = () => {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = `0${currentDate.getMonth() + 1}`.slice(-2);
  const currentDay = `0${currentDate.getDate()}`.slice(-2);
  const dateAfter = `date_after=${currentYear}-${currentMonth}-${currentDay}`;
  const dateBefore = `date_before=${currentYear
    + 1}-${currentMonth}-${currentDay}`;
  return `?${dateAfter}&${dateBefore}&page_size=30`;
};

const getEventsFromAbakus = async () => {
  const eventsFromAbakus = await axios.get(eventsURL + dateString());
  const eventsArray = eventsFromAbakus.data.results;

  const eventsId = [];
  for (let i = 0; i < eventsArray.length; i += 1) {
    eventsId.push(eventsArray[i].id);
  }

  const registrationLink = await Promise.all(
    eventsId.map(x => axios.get(eventsURL + x)),
  );

  for (let i = 0; i < registrationLink.length; i += 1) {
    eventsArray[i].registrationTime = registrationLink[i].data.pools.length > 0
      ? (registrationLink[i].data.pools[0].activationDate)
      : null;
  }
  eventsCache = eventsArray;
};

getEventsFromAbakus();
setInterval(getEventsFromAbakus, 30 * 1000);

const events = async (ctx) => {
  ctx.body = eventsCache;
};

console.log(events);

const router = new Router();
router.get('/', events);

export default router;
