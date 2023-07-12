import Joi from 'joi'
import Switchboards from '../../models/Switchboards'
import Meters from '../../models/Meters'
import Clients from '../../models/Clients'
import Lectures from '../../models/Lectures'
import dotEnv from 'dotenv'
//import Axios from '../../utils/axiosInstance'
import Axios from 'axios'

dotEnv.config()

export default [
    {
        method: 'GET',
        path: '/api/switchboards',
        options: {
            description: 'get all switchboards data',
            notes: 'return all data from switchboards',
            tags: ['api'],
            handler: async (request, h) => {
                try {
                    //let switchboards = await Switchboards.find().lean().populate(['meters'])
                    //[{ path: 'members', populate: { path: 'address.sector'} }

                    let switchboards = await Switchboards.find().lean().populate([{ path: 'meters', populate: { path: 'clients'} }])
                    
                    return switchboards
                } catch (error) {
                    console.log(error)

                    return h.response({
                        error: 'Internal Server Error'
                    }).code(500)
                }
            }
        }
    },
    {
        method: 'GET',
        path: '/api/allLectures/{id}',
        options: {
            description: 'documentos asociados',
            notes: 'documentos asociados',
            tags: ['api'],
            handler: async (request, h) => {
                try {
                    let id = request.params.id
                    let switchboard = await Switchboards.findById(id).lean()
                    let ip = switchboard.ip_address
                    let token = switchboard.token
                    //let res = await Axios.get(`http://192.168.0.14/api/meters/all/values?recordNumber=217088`, {
                    let res = await Axios.get(`http://${ip}/api/meters/all/values?recordNumber=217088`, {
                        headers: {
                          "Authorization": `Longterm ${token}`
                        }
                    })

                    return res.data
                } catch (error) {
                    console.log(error)

                    return h.response({
                        error: 'Internal Server Error'
                    }).code(500)
                }
            }
        }
    },
    {
        method: 'GET',
        path: '/api/meterByID/{id}',
        options: {
            description: 'documentos asociados',
            notes: 'documentos asociados',
            tags: ['api'],
            handler: async (request, h) => {
                try {
                    let id = request.params.id
                    let meter = await Meters.findById(id).lean()
                    meter.lectures = []
                    
                    let queryMeter = {
                        meters: id/*,
                        year: d.getFullYear(),
                        month: d.getMonth() + 1*/
                    }
                    let meterLecture = await Lectures.find(queryMeter).lean()
                    for(let i=0; i<meterLecture.length; i++){
                        for(let j=0; j<meterLecture[i].lectures.length; j++){
                            meter.lectures.push(meterLecture[i].lectures[j])
                        }
                    }

                    return meter
                } catch (error) {
                    console.log(error)

                    return h.response({
                        error: 'Internal Server Error'
                    }).code(500)
                }
            }
        }
    },
    {
        method: 'GET',
        path: '/api/allLecturesSave/{id}',
        options: {
            description: 'documentos asociados',
            notes: 'documentos asociados',
            tags: ['api'],
            handler: async (request, h) => {
                try {
                    let id = request.params.id
                    let switchboard = await Switchboards.findById(id).lean()
                    let ip = switchboard.ip_address
                    let token = switchboard.token
                    let res = await Axios.get(`http://${ip}/api/meters/all/values?recordNumber=217088`, {
                        headers: {
                          "Authorization": `Longterm ${token}`
                        }
                    })

                    let switchboards = await Switchboards.find().lean().populate(['meters'])
                    
                    let meters = switchboards[0].meters
                    let lectures = res.data
                    for(let i=0; i<meters.length; i++){

                        let lecture = lectures.find(x => x.primaryAddress == meters[i].address)

                        const d = new Date();

                        let queryMeter = {
                            meters: meters[i]._id,
                            year: d.getFullYear(),
                            month: d.getMonth() + 1
                        }
                        let meterLecture = await Lectures.find(queryMeter).lean()

                        if(meterLecture.length==0){
                            let query = {
                                meters: meters[i]._id,
                                year: d.getFullYear(),
                                month: d.getMonth() + 1,
                                lectures: [{     
                                    value: lecture.dataPoints[0].value
                                }]
                            }

                            let lectureSave = new Lectures(query)
                            await lectureSave.save()
                        }else{

                            let lectureUpdate = await Lectures.findById(meterLecture[0]._id)
                            lectureUpdate.lectures.push({     
                                value: lecture.dataPoints[0].value
                            })

                            await lectureUpdate.save()
                        }
                    }
                    

                    return true
                } catch (error) {
                    console.log(error)

                    return h.response({
                        error: 'Internal Server Error'
                    }).code(500)
                }
            }
        }
    },
]