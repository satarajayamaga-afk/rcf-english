// The Google Doc behind each lesson plan, so a page can link a teacher to the
// editable original instead of carrying a copy of the file.
//
// IMPORTANT - read "shared" before turning this on.
//
// On 2 November 2026 the folder "Grammar Lesson Plans New Batch 1" and all
// sixty documents in it were private: the only permission on each was the
// owner's. A link published while that is true sends every visitor to a
// "You need access" page, which is worse than no link at all.
//
// So the links are off until the documents are shared as
//   Anyone with the link - Viewer
// and never as Editor: an Editor link lets any visitor rewrite the plan.
//
// Set shared to true once that is done, and every plan page picks up its link
// on the next build. Nothing else needs changing.
module.exports = {
  shared: false,

  // Plan key (the file name in ./plans, without .md) -> Google Doc file id.
  docs: {
    "01-A1": "1IoUjToEhaiNFw4xiu4-qf2HtWvJsn_cQvcXYmVRo3p4",
    "01-A2": "1b7qsZbiEZRHPox_rdzpuYJSAq1Jlm_YFhpD8zGQ6q7A",
    "01-B1": "1s4nftUBwMTO2sjn0xNIuVHuKHk9AXHXUNTAvqc5EoGU",
    "01-B2": "1XVy4JeZysJDH9AGjjsMyVrjPUFsvF1tuRzuiLZWtTPc",
    "01-C1": "1Sr5wpo71uZyKhjYNY6NdxjANb963vqIcLM00Rqj48w0",

    "02-A1": "1u3iS8p5eL5ghHQMB65v6iZB-pXqF7RNsFkkKP0C1L3U",
    "02-A2": "1iSAvsCkqRmM9rxySx_3IAZ5foEYBZIcts6hlYNjcCl8",
    "02-B1": "139LKJwzXfS_lemTmwqOJxO9_3inGO66Oh_iAHRhz7IE",
    "02-B2": "1B4MWG7Aofdy0BrZzDWjLSRCCM2cyzMKu-Hj3mOu5Z4k",
    "02-C1": "1-wx7YtCtE0OaWwGk8PeMZarKWiAvdHB8sa1NDSXZhso",

    "03-A1": "1UMkdXAszs_rVa2v8ZsdlT15WcmKBb9x4pZytkKHbVwI",
    "03-A2": "114ZNcBwfXXwN64XizxgX0viJh-RezqMqEFcN-4WV5lo",
    "03-B1": "1mcWIk-NsTKlJ3S8NVdq9TaKHMwwdyqzcL9ANQ_7Mk18",
    "03-B2": "17IBSrDsVsLN8dJ9gTr69j_zCsHxLsz3p2O04PiXqI8U",
    "03-C1": "1-6dLQFb0hN0ZhJl_VbKvujC6Ml0aQMCuqQG5bsOkap4",

    "04-A1": "1i3BsE8fFvuEbhfgnMGoWXJdWS2iwxD5Fo9yuEPY7Gz0",
    "04-A2": "1oS9jO0EET-uKFxQvFlAV44yrwdzZJAdlIc0GHE6ywYc",
    "04-B1": "1IL2KyhO98Drb7Wuj1nPf2tp8Olbw3r8LyjiwyVGle-8",
    "04-B2": "1PE4XoKZXHHjwjaL3ibKaWGrYZutMIF0KMOpXVLAOhpg",
    "04-C1": "1rdaKnsVsRBxMFr5TlqMTvPjgkRFES4NOpg2ocXK_i-E",

    "05-A1": "1QbBfou8ZEAxMBaMM45UunRW3maOGdfWbL0hi5Gp7XtQ",
    "05-A2": "1n85NgVBvNxrfI0HiM41dDV9Jh63LVXMfiF-RIRFlqxc",
    "05-B1": "1wHVGPMg8eLa-VojVzqxSEJQAVG9MdHpZNEuACE9Tvaw",
    "05-B2": "1WxhTG4P6V6SQI5ObAIGvoZJMRRfyp_vvLQw_HI790yo",
    "05-C1": "1Vat7Y7VhFBc8klaoq6_1DigQNTqr1QKa0W7-s-ndoOM",

    "06-A1": "1An5ecth2QxAAxvQ_VFoE6LGArLLZEjgZrh0MR7geNGM",
    "06-A2": "1Zw73kpTkVgNEoaoQhQLr_stp6R9CN1WEmFzZEzHau9Q",
    "06-B1": "1RTaFJmUqlyqfgrgKSddCMJ2NGp5n_XZFEF628DgFCVU",
    "06-B2": "1G6nEShdUADo626t_4YTjZGfHDW5jy4GDLTDaZkFiVbA",
    "06-C1": "1Xu4kCxQjQoMtw_T5bKe9YGuWXDOCHYVj2fC32JOPLIs",

    "07-A1": "1COdEFg8hAI8Y26lyTXWYoSzy_VE-8tMLdlPGGFoI67c",
    "07-A2": "1115JIn2lese6KZOCU4G5NJ5H2TyPRmvqLPnnzXAd-fQ",
    "07-B1": "126k6UcOHElW5iu9Z40osNU5IbGCHgzY5I45HRyhH76g",
    "07-B2": "1gJ4Dj61vscEfvX7krmNsvSRgfRBeFjrxT_apueQfblo",
    "07-C1": "1Aiy70VD7CaANPNnKPprNkH4mi4xehwuVfXAZiqaSeCM",

    "08-A1": "1H80meowDmJPKe87bs26rCxb_Z3ON2YZQ5R7091WeNw8",
    "08-A2": "1j51zz7jNVLl-OndTW49gpi0_JL9ssdgOZr4G4ObwXwQ",
    "08-B1": "1pIVvciKrcLlsn9PPtakMOzigVFiJfEncVa07_l9YzKw",
    "08-B2": "1urujY1JlPIIFtFimL9E2IvAANF_uMRIsLjO7BQcENUA",
    "08-C1": "1TwOMLYOC9L3gH9L3OUb26UlZRJD_nLFK1J_Pp6_5ZPc",

    "09-A1": "17kKDZTcjz5rmIQUNuzMiCUbsGTqI6xJ5Gnf_rOm7rrw",
    "09-A2": "1som-SbNIaK4v1o7YS51dY3BMNkDbKmPuB__cs6fx55I",
    "09-B1": "1zYz6pS4jlqomvSOjRbhnPZnZnBf3NOK8BI415d44xRU",
    "09-B2": "1qlfo_s49t1rh9X4vy73f2ZtYRFSl-GlMVbaBkySvPOA",
    "09-C1": "1oLIqzzncE2nDL58qRHKGgwoQPsV9kwXzX6bmrT4eoN0",

    "10-A1": "19MQzj6kop2XjII3cjeJZ8vq16wgeGJBha-dGSJl0Zzg",
    "10-A2": "1rW6t7bc37FZCJp13zzHgDFGVl5joB5XdjQkSLQddn64",
    "10-B1": "1U6TVHTQYCHG1hquRpjWTQ4v00Qy7NUTQOZusoJfOQP0",
    "10-B2": "1beV8njQFLDv3unKeaKVjewGrM_AFVGxOsNogJT81yTU",
    "10-C1": "1S79bIgOQsHuNIrDSf73cuJoU-Jynt_Ik8QIoagK_hw4",

    "11-A1": "1y-2PgNS3_j4IjB5bUtBTR3DQ46-2Ayw8uo5DSNJFgds",
    "11-A2": "1RiU7q1NmZhXLKtXLc6QGiL9iSMHN6bB7WjkS1v8Na0c",
    "11-B1": "1W0XaQebJO4UxDm5oakS2Rer30AnRzr60k9ZgutFQ06w",
    "11-B2": "1yAy_kPCbvA8NkzRHmgdi31Ejte8IN5sT_atzjQZXny4",
    "11-C1": "1nB58WFA5wCP3BJrE5VynKm7yvWsmc6-5rqgj4HO4xFg",

    "12-A1": "19Y5keM15mC5tn-MMdutjLbn23G7aKxXrEvEp9G4K6i0",
    "12-A2": "1RFJZnzFFiYDrmqE7ULRLkfe3cmKMGcFCR3tLJa-D75I",
    "12-B1": "17LRS1OK8E36MM5k_VHfShdGP8jDXc6_kl1uTzwuhu9o",
    "12-B2": "13nJABLtX_lWyXdPYAWhstO1NlIwVv6R4mfE_-RFCntY",
    "12-C1": "1WCI0zl8ca0wQrNAsESAka0o1DG88gsXU0OnWB3UYSQc"
  }
};
