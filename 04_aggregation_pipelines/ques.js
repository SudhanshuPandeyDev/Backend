// mongodb+srv://sudhanshu:734999@cluster0.9aisi.mongodb.net/

// 1. How to find how many users are active in users ?
// write this code in mongo atlas aggregation
[
  {
    $match: {
      isActive: true,
    },
  },
  {
    $count: "activeUser",
  },
];

// 2. what is the average age of all users (Grouping in MongoDB)

// write this code in mongo atlas aggregation
// Use $avg inside aggregation stages like $group and $project

// to find avg of all documents together
[
  {
    $group: {
      _id: null,
      averageAge: {
        $avg: "$age", // $avg is an accumulator operator
      },
    },
  },
];

// to find avg of all genders differently
// $gender, $age means "take the value of the gender, age field from each document" and use it as the grouping key.
[
  {
    $group: {
      _id: "$gender",
      averageAge: {
        $avg: "$age",
      },
    },
  },
];

// 3. List top 5 common favorite fruit among users

// write this code in mongo atlas aggregation

[
  {
    $group: {
      _id: "$favoriteFruit",
      count: {
        $sum: 1,
      },
    },
  },
  {
    $sort: {
      count: -1, // 1 for sorting in ascending
    },
  },
  {
    $limit: 5,
  },
];

// 4. find the total number of males and females
[
  {
    $group: {
      _id: "$gender",
      count: {
        $sum: 1,
      },
    },
  },
];

// 5. which country has highest number of registered users
[
  {
    $group: {
      _id: "$company.location.country",
      userCount: {
        $sum: 1,
      },
    },
  },
  {
    $sort: {
      userCount: -1,
    },
  },
  {
    $limit: 2,
  },
];

// 6. List all the unique eye colors in the collection
[
  {
    $group: {
      _id: "$eyeColor",
    },
  },
];

// 7. what is the average number of tags per user
// Use $avg inside aggregation stages like $group and $project

// 1st method with unwind
[
  // ids remains same during unwind
  {
    $unwind: "$tags",
  },
  {
    // First group by document ID and count tags per document
    $group: {
      _id: "$_id",
      numberOfTags: {
        $sum: 1,
      },
    },
  },
  {
    // Second group over all documents and calculate the average
    $group: {
      _id: null,
      averageNumberOfTags: {
        $avg: "$numberOfTags",
      },
    },
  },
];

// 2nd method using addFields
[
  {
    $addFields: {
      // ifNull This operator checks if the first argument is null or doesn't exist it will return []
      numberOfTags: {
        $size: { $ifNull: ["$tags", []] },
      },
    },
  },
  {
    $group: {
      _id: null,
      averageNumberOfTags: {
        $avg: "$numberOfTags",
      },
    },
  },
];

// 8. How many users have "enim" as one of their tag
[
  {
    $match: {
      tags: "enim",
    },
  },
  {
    $count: "userWithEnimTag",
  },
];

// 9. what are the age and names of users who are inactive and have "velit" as a tag
[
  {
    $match: {
      isActive: false,
      tags: "velit",
    },
  },
  {
    $project: {
      name: 1, // include name field
      age: 1, // include age field
    },
  },
];

// 10. How many users have a phone number starting with '+1 (940)' ?
[
  {
    // using regex
    // ^ asserts the start of the string.
    // \+1 matches the literal +1.
    // \( matches the opening parenthesis ( and \) matches the closing parenthesis ).
    $match: {
      "company.phone": /^\+1 \(940\)/,
    },
  },
  {
    $count: "userWithSpecialPhoneNumber",
  },
];

// 11. who has registered the most recently ?
[
  {
    $sort: {
      registered: -1,
    },
  },
  {
    $limit: 4,
  },
  {
    $project: {
      name: 1,
      registered: 1,
      favoriteFruit: 1,
    },
  },
];

// 12. categorize user by their favorite fruit
// The $push operator appends the name field from each document in the current group (i.e., those with the same favoriteFruit).
[
  {
    $group: {
      _id: "$favoriteFruit",
      users: {
        $push: "$name",
      },
    },
  },
];

// 13. how many users have "ad" as the second tag in their list of tags
[
  {
    $match: {
      "tags.1": "ad",
    },
  },
  {
    $count: "secondTagAd",
  },
];

// 14. find the users who have both "enim" and "id" as their tags

// $all operator is used to match an array field that contains all the specified elements, regardless of their order.
[
  {
    $match: {
      tags: {
        $all: ["enim", "id"],
      },
    },
  },
];

// 15. list all the companies located in USA with their user count
[
  {
    $match: {
      "company.location.country": "USA",
    },
  },
  {
    $group: {
      _id: "$company.title",
      userCount: { $sum: 1 },
    },
  },
];

// In MongoDB, the $lookup stage is used to perform a left outer join between two collections in a single aggregation pipeline

/*
{
  $lookup: {
    from: "<foreign_collection>",
    localField: "<field_in_local_collection>",
    foreignField: "<field_in_foreign_collection>",
    as: "<output_field>"
  }
}
*/

// $first is used to return the value from the first document in a sorted group.
// if is typically used in combination with group stage
{
  $first: "<expression>";
}

// The $elementAt operator in MongoDB is used to retrieve an element at a specific index from an array. It takes two arguments: the array and the index position of the element you want to retrieve
// { $elementAt: [ <array>, <index> ] }
