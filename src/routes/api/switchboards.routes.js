import Joi from "joi";
import Switchboards from "../../models/Switchboards";
import Meters from "../../models/Meters";
import Clients from "../../models/Clients";
import Lectures from "../../models/Lectures";
import dotEnv from "dotenv";
//import Axios from '../../utils/axiosInstance'
import Axios from "axios";

dotEnv.config();

export default [
  {
    method: "GET",
    path: "/api/switchboards",
    options: {
      description: "get all switchboards data",
      notes: "return all data from switchboards",
      tags: ["api"],
      handler: async (request, h) => {
        try {
          let switchboards = await Switchboards.find()
            .lean()
            .populate([{ path: "meters", populate: { path: "clients" } }]);

          const d = new Date();
          // console.log("switchboards", switchboards);
          let queryMeter = {
            year: d.getFullYear(),
            month: d.getMonth() + 1,
          };
          let lectures = await Lectures.find(queryMeter).lean();

          for (let i = 0; i < switchboards.length; i++) {
            // console.log("Medidores", switchboards[i].meters);
            for (let j = 0; j < switchboards[i].meters.length; j++) {
              let lecture = lectures.find(
                (x) =>
                  x.meters &&
                  switchboards[i].meters[j] &&
                  x.meters.toString() ==
                    switchboards[i].meters[j]._id.toString()
              );
              // console.log("lectura", lecture);
              if (lecture) {
                const lastLecture =
                  lecture.lectures[lecture.lectures.length - 1];
                // console.log("lastLecture", lastLecture);
                if (lastLecture) {
                  switchboards[i].meters[j].lastDate = lastLecture.date;
                  switchboards[i].meters[j].lastLecture = lastLecture.value;
                  switchboards[i].meters[j].lectures = lecture.lectures;
                  //console.log("lastLecture", lecture.lectures);
                } else {
                  console.log("No lectures found for meter.");
                  switchboards[i].meters[j].lastDate = "-";
                  switchboards[i].meters[j].lastLecture = "-";
                }
              } else {
                console.log("No lectures found for meter.");
                switchboards[i].meters[j].lastDate = "-";
                switchboards[i].meters[j].lastLecture = "-";
              }
            }
          }

          return switchboards;
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
    method: "GET",
    path: "/api/allLectures/{id}",
    options: {
      description: "documentos asociados",
      notes: "documentos asociados",
      tags: ["api"],
      handler: async (request, h) => {
        try {
          let id = request.params.id;
          let switchboard = await Switchboards.findById(id).lean();
          let ip = switchboard.ip_address;
          let token = switchboard.token;
          //let res = await Axios.get(`http://192.168.0.14/api/meters/all/values?recordNumber=217088`, {
          let res = await Axios.get(
            `http://${ip}/api/meters/all/values?recordNumber=217088`,
            {
              headers: {
                Authorization: `Longterm ${token}`,
              },
            }
          );

          return res.data;
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
    method: "GET",
    path: "/api/meterByID/{id}",
    options: {
      description: "documentos asociados",
      notes: "documentos asociados",
      tags: ["api"],
      handler: async (request, h) => {
        console.log("request.params.id", request.params.id);
        try {
          let id = request.params.id;
          let meter = await Meters.findById(id).lean();
          console.log("meter", meter);
          meter.lectures = [];

          let queryMeter = {
            meters: id /*,
                        year: d.getFullYear(),
                        month: d.getMonth() + 1*/,
          };
          let meterLecture = await Lectures.findById(queryMeter.meters).lean();
          console.log("meterLecture", meterLecture);
          for (let i = 0; i < meterLecture.length; i++) {
            for (let j = 0; j < meterLecture[i].lectures.length; j++) {
              meter.lectures.push(meterLecture[i].lectures[j]);
            }
          }

          return meter;
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
    path: "/api/createSwitchBoard",
    options: {
      description: "creating a new Switchboard",
      notes: "Switchborads",
      tags: ["api"],
      handler: async (request, h) => {
        try {
          let query = request.payload;
          let lectureSave = new Switchboards(query);
          const res = await lectureSave.save();
          console.log("resss", res);
          return true;
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
  // {
  //   method: "GET",
  //   path: "/api/allLecturesSave/{id}",
  //   options: {
  //     auth: false,
  //     description: "documentos asociados",
  //     notes: "documentos asociados",
  //     tags: ["api"],
  //     handler: async (request, h) => {
  //       try {
  //         //forEach por cada central
  //         let id = request.params.id;
  //         console.log(id);
  //         let switchboard = await Switchboards.findById(id).lean();
  //         let ip = switchboard.ip_address;
  //         let token = switchboard.token;
  //         //recordNumber=217088 es el codigo de los datos que deseo obtener
  //         let res = await Axios.get(
  //           `http://${ip}/api/meters/all/values?recordNumber=217088`,
  //           {
  //             headers: {
  //               Authorization: `Longterm ${token}`,
  //             },
  //           }
  //         );
  //         let switchboards = await Switchboards.find()
  //           .lean()
  //           .populate(["meters"]);
  //         let meters = switchboards[0].meters;
  //         let lectures = res.data;

  //         for (let i = 0; i < meters.length; i++) {
  //           let lecture = lectures.find(
  //             (x) => x.primaryAddress == meters[i].address
  //           );

  //           const d = new Date();

  //           let queryMeter = {
  //             meters: meters[i]._id,
  //             year: d.getFullYear(),
  //             month: d.getMonth() + 1,
  //           };
  //           let meterLecture = await Lectures.find(queryMeter).lean();

  //           if (meterLecture.length == 0) {
  //             let query = {
  //               meters: meters[i]._id,
  //               year: d.getFullYear(),
  //               month: d.getMonth() + 1,
  //               lectures: [
  //                 {
  //                   value: lecture.dataPoints[0].value,
  //                 },
  //               ],
  //             };

  //             let lectureSave = new Lectures(query);
  //             await lectureSave.save();
  //           } else {
  //             let lectureUpdate = await Lectures.findById(meterLecture[0]._id);
  //             lectureUpdate.lectures.push({
  //               value: lecture.dataPoints[0].value,
  //             });

  //             await lectureUpdate.save();
  //           }
  //         }

  //         return {
  //           status: "Almacenado correctamente",
  //         };
  //       } catch (error) {
  //         console.log(error);

  //         return h
  //           .response({
  //             error: "Internal Server Error",
  //           })
  //           .code(500);
  //       }
  //     },
  //   },
  // },
];
