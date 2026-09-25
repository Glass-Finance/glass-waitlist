// Photo pools for the Use Cases carousel.
//
// All photos are from Pexels (https://www.pexels.com/license/) — free for
// commercial use, attribution not required; the source URL of each photo is
// recorded here for provenance. Every URL was HTTP-verified before landing.
//
// `publicId` values are produced by scripts/upload-usecase-photos.mjs and
// delivered from Cloudinary (see docs/cloudinary.md). The component only
// reads `publicId`/`alt` — `src` exists so the upload script can (re)fetch
// the originals. Keep at least 10 photos per category (the carousel shuffles
// within these pools).

export const USECASE_PHOTOS = {
  schools: [
    {
      publicId: "glass/usecase/schools/s01",
      src: "https://images.pexels.com/photos/34162709/pexels-photo-34162709/free-photo-of-group-of-nigerian-schoolchildren-in-classroom.jpeg",
      alt: "Nigerian schoolchildren in a classroom",
    },
    {
      publicId: "glass/usecase/schools/s02",
      src: "https://images.pexels.com/photos/12448839/pexels-photo-12448839.jpeg",
      alt: "Pupils in uniform at wooden benches in a Nigerian classroom",
    },
    {
      publicId: "glass/usecase/schools/s03",
      src: "https://images.pexels.com/photos/10604063/pexels-photo-10604063.jpeg",
      alt: "Graduates in Nigeria celebrating in academic regalia",
    },
    {
      publicId: "glass/usecase/schools/s04",
      src: "https://images.pexels.com/photos/10604068/pexels-photo-10604068.jpeg",
      alt: "Happy graduates at a Nigerian university ceremony",
    },
    {
      publicId: "glass/usecase/schools/s05",
      src: "https://images.pexels.com/photos/27769510/pexels-photo-27769510/free-photo-of-a-group-of-students-sitting-in-a-lecture-hall.jpeg",
      alt: "Students seated in a lecture hall in Lagos",
    },
    {
      publicId: "glass/usecase/schools/s06",
      src: "https://images.pexels.com/photos/36347347/pexels-photo-36347347.jpeg",
      alt: "Group of graduates outside a university building",
    },
    {
      publicId: "glass/usecase/schools/s07",
      src: "https://images.pexels.com/photos/12804469/pexels-photo-12804469.jpeg",
      alt: "Students outside their school in Port Harcourt, Nigeria",
    },
    {
      publicId: "glass/usecase/schools/s08",
      src: "https://images.pexels.com/photos/11927603/pexels-photo-11927603.jpeg",
      alt: "Children in blue uniforms on a school day in Ishiagu, Nigeria",
    },
    {
      publicId: "glass/usecase/schools/s09",
      src: "https://images.pexels.com/photos/14909652/pexels-photo-14909652.jpeg",
      alt: "School children in blue uniforms saluting outdoors",
    },
    {
      publicId: "glass/usecase/schools/s10",
      src: "https://images.pexels.com/photos/34211747/pexels-photo-34211747/free-photo-of-group-of-students-attending-classroom-lecture.jpeg",
      alt: "Students attending a classroom lecture",
    },
    {
      publicId: "glass/usecase/schools/s11",
      src: "https://images.pexels.com/photos/15729784/pexels-photo-15729784/free-photo-of-boys-writing-and-sitting-by-the-wall.jpeg",
      alt: "Boys writing and studying outdoors in Kano, Nigeria",
    },
    {
      publicId: "glass/usecase/schools/s12",
      src: "https://images.pexels.com/photos/28593051/pexels-photo-28593051/free-photo-of-diverse-classroom-of-smiling-students-in-uniform.jpeg",
      alt: "Smiling students in uniform in a diverse classroom",
    },
  ],
  professional: [
    {
      publicId: "glass/usecase/professional/p01",
      src: "https://images.pexels.com/photos/30688593/pexels-photo-30688593/free-photo-of-casual-office-meeting-in-lagos-nigeria.jpeg",
      alt: "Colleagues in a casual office meeting in Lagos, Nigeria",
    },
    {
      publicId: "glass/usecase/professional/p02",
      src: "https://images.pexels.com/photos/30677714/pexels-photo-30677714/free-photo-of-diverse-team-in-business-meeting-at-lagos-office.jpeg",
      alt: "Diverse team in a business meeting at a Lagos office",
    },
    {
      publicId: "glass/usecase/professional/p03",
      src: "https://images.pexels.com/photos/30689114/pexels-photo-30689114/free-photo-of-team-collaboration-meeting-in-lagos-office.jpeg",
      alt: "Team collaborating around a laptop in a Lagos office",
    },
    {
      publicId: "glass/usecase/professional/p04",
      src: "https://images.pexels.com/photos/30677713/pexels-photo-30677713/free-photo-of-colleagues-engaged-in-a-friendly-conversation-with-laptop.jpeg",
      alt: "Two colleagues in a friendly conversation with a laptop",
    },
    {
      publicId: "glass/usecase/professional/p05",
      src: "https://images.pexels.com/photos/30688597/pexels-photo-30688597/free-photo-of-collaborative-office-team-high-fiving-in-lagos.jpeg",
      alt: "Office team celebrating with a high-five in Lagos",
    },
    {
      publicId: "glass/usecase/professional/p06",
      src: "https://images.pexels.com/photos/30677719/pexels-photo-30677719/free-photo-of-professional-collaboration-in-lagos-office.jpeg",
      alt: "Two professionals collaborating in a Lagos office",
    },
    {
      publicId: "glass/usecase/professional/p07",
      src: "https://images.pexels.com/photos/30688595/pexels-photo-30688595/free-photo-of-diverse-business-team-smiling-indoors.jpeg",
      alt: "Diverse business team smiling together",
    },
    {
      publicId: "glass/usecase/professional/p08",
      src: "https://images.pexels.com/photos/3869649/pexels-photo-3869649.jpeg",
      alt: "African women collaborating in an office meeting",
    },
    {
      publicId: "glass/usecase/professional/p09",
      src: "https://images.pexels.com/photos/12179672/pexels-photo-12179672.jpeg",
      alt: "Two businessmen in suits talking on a city street",
    },
    {
      publicId: "glass/usecase/professional/p10",
      src: "https://images.pexels.com/photos/8761679/pexels-photo-8761679.jpeg",
      alt: "Three business professionals smiling at an event",
    },
    {
      publicId: "glass/usecase/professional/p11",
      src: "https://images.pexels.com/photos/9301288/pexels-photo-9301288.jpeg",
      alt: "Colleagues in a productive meeting around a conference table",
    },
    {
      publicId: "glass/usecase/professional/p12",
      src: "https://images.pexels.com/photos/37198880/pexels-photo-37198880/free-photo-of-team-of-engineers-reviewing-construction-plans.jpeg",
      alt: "Engineers reviewing construction plans together",
    },
  ],
  clubs: [
    {
      publicId: "glass/usecase/clubs/c01",
      src: "https://images.pexels.com/photos/36897267/pexels-photo-36897267/free-photo-of-traditional-nigerian-cultural-gathering-in-kano.jpeg",
      alt: "Women in traditional attire at a cultural event in Kano, Nigeria",
    },
    {
      publicId: "glass/usecase/clubs/c02",
      src: "https://images.pexels.com/photos/25703722/pexels-photo-25703722/free-photo-of-a-group-of-people-dancing-in-traditional-patterned-clothing.jpeg",
      alt: "Group dancing in traditional patterned clothing in Benin",
    },
    {
      publicId: "glass/usecase/clubs/c03",
      src: "https://images.pexels.com/photos/34735511/pexels-photo-34735511/free-photo-of-vibrant-african-cultural-dance-performance-outdoors.jpeg",
      alt: "Vibrant African cultural dance performance outdoors",
    },
    {
      publicId: "glass/usecase/clubs/c04",
      src: "https://images.pexels.com/photos/25856942/pexels-photo-25856942/free-photo-of-people-standing-in-traditional-clothing-in-traditional-ceremony-in-village.jpeg",
      alt: "People in traditional clothing at a village ceremony",
    },
    {
      publicId: "glass/usecase/clubs/c05",
      src: "https://images.pexels.com/photos/34735590/pexels-photo-34735590/free-photo-of-traditional-african-festival-gathering-outdoors.jpeg",
      alt: "Traditional African festival gathering outdoors",
    },
    {
      publicId: "glass/usecase/clubs/c06",
      src: "https://images.pexels.com/photos/36873980/pexels-photo-36873980/free-photo-of-celebratory-toast-with-champagne-in-luanda.jpeg",
      alt: "Friends sharing a celebratory toast in Luanda, Angola",
    },
    {
      publicId: "glass/usecase/clubs/c07",
      src: "https://images.pexels.com/photos/5935188/pexels-photo-5935188.jpeg",
      alt: "Friends toasting together outdoors on a sunny day",
    },
    {
      publicId: "glass/usecase/clubs/c08",
      src: "https://images.pexels.com/photos/7502603/pexels-photo-7502603.jpeg",
      alt: "Group of friends enjoying an outdoor event",
    },
    {
      publicId: "glass/usecase/clubs/c09",
      src: "https://images.pexels.com/photos/12139777/pexels-photo-12139777.jpeg",
      alt: "Friends enjoying a lively indoor gathering",
    },
    {
      publicId: "glass/usecase/clubs/c10",
      src: "https://images.pexels.com/photos/6706030/pexels-photo-6706030.jpeg",
      alt: "Friends celebrating with champagne glasses",
    },
    {
      publicId: "glass/usecase/clubs/c11",
      src: "https://images.pexels.com/photos/11946825/pexels-photo-11946825.jpeg",
      alt: "Friends celebrating at a beach party with balloons",
    },
    {
      publicId: "glass/usecase/clubs/c12",
      src: "https://images.pexels.com/photos/32079631/pexels-photo-32079631/free-photo-of-group-portrait-at-an-indoor-celebration-event.jpeg",
      alt: "Friends posing together at an indoor celebration with balloons",
    },
  ],
  religious: [
    {
      publicId: "glass/usecase/religious/r01",
      src: "https://images.pexels.com/photos/16274229/pexels-photo-16274229/free-photo-of-people-praying-inside-a-church.jpeg",
      alt: "People kneeling and praying in a church in Benin City, Nigeria",
    },
    {
      publicId: "glass/usecase/religious/r02",
      src: "https://images.pexels.com/photos/30550589/pexels-photo-30550589/free-photo-of-energetic-church-choir-singing-in-lagos.jpeg",
      alt: "Energetic church choir singing in Lagos",
    },
    {
      publicId: "glass/usecase/religious/r03",
      src: "https://images.pexels.com/photos/37758375/pexels-photo-37758375/free-photo-of-ceremonial-gathering-in-monrovia-church.jpeg",
      alt: "Ceremonial gathering inside a church in Monrovia, Liberia",
    },
    {
      publicId: "glass/usecase/religious/r04",
      src: "https://images.pexels.com/photos/8815004/pexels-photo-8815004.jpeg",
      alt: "Woman pastor speaking with a choir behind her",
    },
    {
      publicId: "glass/usecase/religious/r05",
      src: "https://images.pexels.com/photos/8814996/pexels-photo-8814996.jpeg",
      alt: "Minister delivering a sermon with choir and parishioners",
    },
    {
      publicId: "glass/usecase/religious/r06",
      src: "https://images.pexels.com/photos/20879653/pexels-photo-20879653/free-photo-of-ethiopians-taking-part-in-an-orthodox-religious-festival.jpeg",
      alt: "Ethiopian Orthodox faithful at an outdoor religious festival",
    },
    {
      publicId: "glass/usecase/religious/r07",
      src: "https://images.pexels.com/photos/8270597/pexels-photo-8270597.jpeg",
      alt: "Joyful gathering during a church ceremony",
    },
    {
      publicId: "glass/usecase/religious/r08",
      src: "https://images.pexels.com/photos/35388499/pexels-photo-35388499/free-photo-of-joyful-celebration-in-a-vibrant-church-setting.jpeg",
      alt: "Young men celebrating joyfully in church",
    },
    {
      publicId: "glass/usecase/religious/r09",
      src: "https://images.pexels.com/photos/8815046/pexels-photo-8815046.jpeg",
      alt: "Man and woman singing during a lively church service",
    },
    {
      publicId: "glass/usecase/religious/r10",
      src: "https://images.pexels.com/photos/7520354/pexels-photo-7520354.jpeg",
      alt: "Choristers singing in a cathedral with stained glass",
    },
    {
      publicId: "glass/usecase/religious/r11",
      src: "https://images.pexels.com/photos/30327295/pexels-photo-30327295/free-photo-of-orthodox-church-celebration-in-addis-ababa.jpeg",
      alt: "Orthodox priests and worshippers in procession in Addis Ababa",
    },
    {
      publicId: "glass/usecase/religious/r12",
      src: "https://images.pexels.com/photos/38274945/pexels-photo-38274945/free-photo-of-aerial-view-of-congregation-in-church-interior.jpeg",
      alt: "Congregation gathered for worship inside a church",
    },
  ],
};
