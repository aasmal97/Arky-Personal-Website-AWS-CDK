import axios from 'axios'
axios({
    url: 'https://api.arkyasmal.com/skills',
    method: 'get',
    params: {
        query: JSON.stringify({}),
        max: 200
    }
}).then((e) => {
    console.log(e)
}).catch((err) => {
    console.error(err.response.data)
})