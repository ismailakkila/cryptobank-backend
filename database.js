var bcrypt = require("bcrypt");
var ObjectId = require("mongodb").ObjectId;

var usersCollection = "users";

var insertOne = function(db, collection, insertObject) {
  return db.collection(collection).insertOne(insertObject)
    .then(function(document) {
      if (document) {
        return {
          err: null,
          document: document.ops[0]
        };
      }
      else {
        return {
          err: null,
          document: null
        };
      }
    })
    .catch(function(err) {
      throw {
        err: err,
        document: null
      };
    });
};

var findOne = function(db, collection, findObject) {
  return db.collection(collection).findOne(findObject)
    .then(function(document) {
      if (document) {
        return {
          err: null,
          document: document
        };
      }
      else {
        return {
          err: null,
          document: null
        };
      }
    })
    .catch(function(err) {
      throw {
        err: err,
        document: null
      };
    })
};

var findMany = function(db, collection, optionParams) {
  return db.collection(collection).aggregate(optionParams).toArray()
    .then(function(document) {
      if (document) {
        return {
          err: null,
          document: document
        };
      }
      else {
        return {
          err: null,
          document: null
        };
      }
    })
    .catch(function(err) {
      throw {
        err: err,
        document: null
      };
    });
};

var updateOne = function(db, collection, queryObject, updateObject, optionsObject) {
  return db.collection(collection).findAndModify(
    queryObject,
    {},
    updateObject,
    optionsObject
  )
    .then(function(document) {
      if (document) {
        return {
          err: null,
          document: document.value
        };
      }
      else {
        return {
          err: null,
          document: null
        };
      }
    })
    .catch(function(err) {
      throw {
        err: err,
        document: null
      };
    });
};

var deleteOne = function(db, collection, deleteObject) {
  return db.collection(collection).deleteOne(deleteObject)
    .then(function(document) {
      if (!document) {
        return {
          err: null,
          document: null
        };
      }
      if (document.result.n === 1) {
        return {
          err: null,
          document: {
            result: "success"
          }
        };
      }
      else {
        return {
          err: null,
          document: null
        };
      }
    })
    .catch(function(err) {
      throw {
        err: err,
        document: null
      };
    });
};

var getCollectionCount = function(collection) {
  return new Promise(function(resolve, reject) {
    db.collection(collection).countDocuments()
      .then(function(count) {
        if (count >= 0) {
          resolve({
            err: null,
            document: String(count)
          });
        }
        else {
          resolve({
            err: null,
            document: null
          });
        }
      })
      .catch(function(err) {
        reject({
          err: err,
          document: null
        });
      });
  });
};

var getCollectionCount = function(db, collection) {
  return db.collection(collection).countDocuments()
    .then(function(count) {
      if (count >= 0) {
        return {
          err: null,
          document: String(count)
        };
      }
      else {
        return {
          err: null,
          document: null
        };
      }
    })
    .catch(function(err) {
      throw {
        err: err,
        document: null
      };
    });
};

var authenticateUser = function(db) {
  return function(username, password) {
    return findOne(db, usersCollection, {username: username})
      .then(function(user) {
        if (user.document) {
          var continueCheckPassword = user.document.initialToken === null &&
            user.document.password && user.document.enabled;
          if (continueCheckPassword) {
            return user.document;
          }
        }
        return null;
      })
      .then(function(user) {
        if (user) {
          return bcrypt.compare(password, user.password)
            .then(function(result) {
              if (result) {
                return user;
              }
              else {
                return null;
              }
            });
        }
        return null;
      })
      .then(function(user) {
        if (user) {
          return setLoginTime(db)(user._id);
        }
        return null;
      })
      .then(function(user) {
        if (user) {
          return {
            err: null,
            document: user
          };
        }
        else {
          return {
            err: null,
            document: null
          };
        }
      })
      .catch(function(err) {
        throw {
          err: err,
          document: null
        };
      });
  };
};

var findUser = function(db) {
  return function(query, allDetails=false) {
    return findOne(db, usersCollection, query)
      .then(function(user) {
        if (user.document) {
          if (allDetails) {
            return {
              err: null,
              document: user.document
            };
          }
          else {
            return {
              err: null,
              document: {
                _id: user.document._id,
                username: user.document.username,
                passwordResetRequired: Boolean(user.document.initialToken !== null)
              }
            };
          }
        }
        else {
          return user;
        }
      })
      .catch(function(err) {
        throw err;
      });
  };
};

var setUserPassword = function(db) {
  return function(findQuery, modifyParams) {
    var password = modifyParams.password;
    return bcrypt.hash(password, 12)
    .then(function(hash) {
      return {
        $set: Object.assign({}, modifyParams, {password: hash})
      };
    })
    .then(function(updateParams) {
      return updateOne(db, usersCollection, findQuery, updateParams, {new: true})
        .then(function(updateResult) {
          if (updateResult.document) {
            return {
              err: null,
              document: {
                _id: updateResult.document._id,
                username: updateResult.document.username,
                passwordResetRequired: Boolean(updateResult.document.initialToken !== null)
              }
            };
          }
          else {
            return updateResult;
          }
        });
    })
    .catch(function(err) {
      if (err.hasOwnProperty("err")) {
        throw err;
      }
      throw {
        err: err,
        document: null
      };
    });
  }
};

var setLoginTime = function(db) {
  return function(userId) {
    var findQuery = {
      _id: new ObjectId(userId)
    };
    var updateParams = {
      $set: {
        lastLoginAt: Date.now()
      }
    };
    return updateOne(db, usersCollection, findQuery, updateParams, {new: true})
      .then(function(updateResult) {
        if (updateResult.document) {
          return {
            _id: updateResult.document._id,
            username: updateResult.document.username,
            firstName: updateResult.document.firstName,
            lastName: updateResult.document.lastName,
            email: updateResult.document.email,
            mobileNumber: updateResult.document.mobileNumber,
            lastLoginAt: updateResult.document.lastLoginAt
          };
        }
        else {
          return null;
        }
      })
      .catch(function(err) {
        if (err.hasOwnProperty("err")) {
          throw err;
        }
        throw {
          err: err,
          document: null
        };
      });
  }
};

module.exports = function(db) {
  return {
    authenticateUser: authenticateUser(db),
    findUser: findUser(db),
    setUserPassword: setUserPassword(db),
    setLoginTime: setLoginTime(db)
  };
};
