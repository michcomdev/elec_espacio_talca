import Joi from "joi";
import Meters from "../../models/Meters";
import Switchboards from "../../models/Switchboards";
import Type from "../../models/Types";
import dotEnv from "dotenv";
import Client from "../../models/Clients";
import Lectures from "../../models/Lectures";
dotEnv.config();

export default [
  {
    method: "POST",
    path: "/api/getActiveMeters",
    options: {
      description: "Get all active meters with client and lectures data",
      notes:
        "Return data from active meters with associated clients and lectures",
      tags: ["api"],
      handler: async (request, h) => {
        let data;
        try {
          const startDate = new Date(request.payload.fechaDesde);
          const endDate = new Date(request.payload.fechaHasta);
          const startMonth = startDate.getUTCMonth() + 1;
          const startYear = startDate.getUTCFullYear();
          const endMonth = endDate.getUTCMonth() + 1;
          const endYear = endDate.getUTCFullYear();

          const allActiveMeters = await Meters.find({ status: "active" })
            .populate("clients")
            .lean();
          // Corrige la consulta a la base de datos para obtener medidores activos en el rango de fechas
          const lecture = await Lectures.find({
            month: { $gte: startMonth, $lte: endMonth },
            year: { $gte: startYear, $lte: endYear },
          })
            .populate("clients")
            .lean();

          if (allActiveMeters) {
            for (let index = 0; index < allActiveMeters.length; index++) {
              const element = allActiveMeters[index];
              for (let j = 0; j < lecture.length; j++) {
                const lecturas = lecture[j];
                console.log("lecturas", lecturas.lectures);
                let arrLectures = lecturas.lectures;
                for (let k = 0; k < arrLectures.length; k++) {
                  console.log("arrLectures", arrLectures[k]);
                }
                if (element._id.toString() === lecturas.meters.toString()) {
                  element.meter = lecturas;
                }
              }
            }
          }

          return allActiveMeters;
        } catch (error) {
          console.error(error);
          return h
            .response({
              error: "Internal Server Error",
            })
            .code(500);
        }
      },
    },
  },

  {
    method: "POST",
    path: "/api/postMeter",
    options: {
      description: "get all users data",
      notes: "return all data from users",
      tags: ["api"],
      handler: async (request, h) => {
        console.log(request.payload);
        let payload = request.payload;
        try {
          let dataQuery = {
            name: payload.name,
            address: payload.address,
            clients: payload.clients,
            serialNumber: payload.serialNumber,
          };
          const newUser = new Meters(dataQuery);
          await newUser.save();

          let switchboartId = payload.switchId;
          let member = await Switchboards.findById(switchboartId);

          member.meters.push(newUser._id);

          const response = await member.save();
          console.log("meter added", response);

          // Assuming Meters constructor returns a promise

          // If all goes well, you can return a success response here
          return { success: true };
        } catch (error) {
          console.error(error);

          // Return an error response
          return h
            .response({
              error: "Internal Server Error",
            })
            .code(500);
        }
      },
    },
  },
  {
    method: "POST",
    path: "/api/removeMeterById",
    handler: (request, h) => {
      const { switchboardId, meterId } = request.payload;

      // Encuentra el switchboard por su ID
      const switchboard = Switchboards.find((s) => s.id === switchboardId);

      if (!switchboard) {
        return { error: "Switchboard no encontrado" };
      }

      // Elimina el medidor por su ID
      const index = switchboard.meters.indexOf(meterId);
      if (index !== -1) {
        switchboard.meters.splice(index, 1);
        return { message: "Medidor eliminado con éxito" };
      } else {
        return { error: "Medidor no encontrado en el switchboard" };
      }
    },
  },
  {
    method: "POST",
    path: "/api/updateMeterById",
    options: {
      description: "Update meter data by ID",
      notes: "Update meter data and clients field by meter ID",
      tags: ["api"],
      handler: async (request, h) => {
        console.log(request.payload);
        let payload = request.payload;
        let meterData = {
          name: payload.name,
          address: payload.address,
          serialNumber: payload.serialNumber,
          clients: payload.clients, // Actualiza el campo "clients" con el valor proporcionado en la solicitud
        };
        // console.log("clienteID", meterData.clients);
        let meterId = payload.meterId;

        try {
          // console.log("Meter data:", meterData);

          const res = await Meters.findByIdAndUpdate(meterId, meterData);

          console.log("Result:", res);
          return res; // Devuelve el objeto actualizado
        } catch (error) {
          console.log(error);
          return h
            .response({
              error: "Internal Server Error",
            })
            .code(500);
        }
      },
    },
  },

  {
    method: "POST",
    path: "/api/getLecturesByDate",
    options: {
      description: "Get all active meters with client and lectures data",
      notes:
        "Return data from active meters with associated clients and lectures",
      tags: ["api"],
      handler: async (request, h) => {
        let data;
        try {
          const startDate = new Date(request.payload.fechaDesde);
          const endDate = new Date(request.payload.fechaHasta);
          const startMonth = startDate.getUTCMonth() + 1;
          const startYear = startDate.getUTCFullYear();
          const endMonth = endDate.getUTCMonth() + 1;
          const endYear = endDate.getUTCFullYear();

          const switchboards = await Switchboards.find().populate("meters").lean()

          let queryLecture = { 
              'lectures.date': {
                  $gte: startDate,
                  $lte: endDate
              }
          }

          const lectures = await Lectures.find(queryLecture)

          for(let j=0; j<switchboards.length; j++){
              for(let k=0; k<switchboards[j].meters.length; k++){
                  let lecture = lectures.filter(x=> x.meters.toString()==switchboards[j].meters[k]._id.toString())
                  
                  let first = {}, last = {}

                  if(lecture.length>0){
                      for (let l = 0; l < lecture.length; l++) { 
                          if(lecture[l].lectures){
                              for (let m = 0; m < lecture[l].lectures.length; m++) { 
                                  if (lecture[l].lectures[m].date < startDate || lecture[l].lectures[m].date > endDate) { 
                                      let spliced = lecture[l].lectures.splice(m, 1)
                                  }
                              }
                          }
                      }

                      lecture.sort((a,b) => (a.month > b.month) ? 1 : ((b.month > a.month) ? -1 : 0))
                      lecture.sort((a,b) => (a.year > b.year) ? 1 : ((b.year > a.year) ? -1 : 0))
                      first = lecture[0].lectures[0]
                      last = lecture[lecture.length-1].lectures[lecture[lecture.length-1].lectures.length-1]
                  }
                  switchboards[j].meters[k].lecturesAll = lecture
                  switchboards[j].meters[k].lectureFirst = first
                  switchboards[j].meters[k].lectureLast = last
              }
          }

          /*let queryLecture = { $or: [
            { year: startYear, month: startMonth },
            { year: endYear, month: endMonth }
          ]}

          console.log(queryLecture)
          const lectures = await Lectures.find(queryLecture)

          for(let j=0; j<switchboards.length; j++){
            for(let k=0; k<switchboards[j].meters.length; k++){
                switchboards[j].meters[k].lectures = lectures.filter(x=> x.meters.toString()==switchboards[j].meters[k]._id.toString())
            }
          }*/

          
          /*let lectures = []
          if(startYear==endYear){
              let queryLecture = {
                month: { $gte: startMonth, $lte: endMonth },
                year: startYear
              }
              const lectures1 = await Lectures.find(queryLecture)
              lectures = lectures1
          }else{
              for(let i=startYear; i<=endYear; i++){
                  let queryLecture = {}
                  if(i==startYear){
                      queryLecture = { year: startYear, month: { $gte: startMonth } }
                  }else if(i==endYear){
                      queryLecture = { year: endYear, month: { $lte: endMonth } }
                  }else{
                      queryLecture = { year: i }
                  }
                  console.log(queryLecture)
                  const lectures1 = await Lectures.find(queryLecture)
                  lectures = lectures.concat(lectures1)

                  if(i==endYear){
                      for(let j=0; j<switchboards.length; j++){
                          for(let k=0; k<switchboards[j].meters.length; k++){
                              switchboards[j].meters[k].lectures = lectures.filter(x=> x.meters.toString()==switchboards[j].meters[k]._id.toString())
                          }
                      }
                  }
              }
          }*/

          //return lectures
          return switchboards

          const allActiveMeters = await Meters.find({ status: "active" })
            .populate("clients")
            .lean();
          // Corrige la consulta a la base de datos para obtener medidores activos en el rango de fechas
          const lecture = await Lectures.find({
            month: { $gte: startMonth, $lte: endMonth },
            year: { $gte: startYear, $lte: endYear },
          })
            .populate("clients")
            .lean();

          if (allActiveMeters) {
            for (let index = 0; index < allActiveMeters.length; index++) {
              const element = allActiveMeters[index];
              for (let j = 0; j < lecture.length; j++) {
                const lecturas = lecture[j];
                console.log("lecturas", lecturas.lectures);
                let arrLectures = lecturas.lectures;
                for (let k = 0; k < arrLectures.length; k++) {
                  console.log("arrLectures", arrLectures[k]);
                }
                if (element._id.toString() === lecturas.meters.toString()) {
                  element.meter = lecturas;
                }
              }
            }
          }

          return allActiveMeters;
        } catch (error) {
          console.error(error);
          return h
            .response({
              error: "Internal Server Error",
            })
            .code(500);
        }
      },
    },
  }
];
