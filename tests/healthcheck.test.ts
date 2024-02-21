import axios from 'axios'

test('healthcheck returns 200 OK', async () => {
    console.log('API_URL:', process.env.API_URL)
    await axios.get(process.env.API_URL + '/healthcheck').then((response) => {
        expect(response.status).toBe(200)
    })
})
