
exports.uploadFile = (req, res) => {



  if (!req.files || Object.keys(req.files).length === 0) {
    
    return res.status(400).json({ error: 'No file uploaded' });
  }

  // Access the uploaded file using req.files
  const files = req.files.files;
  const types = req.body.types;
  const id    = req.body.id;

  if(files.length > 1){
    files.forEach((file, index) => {

      console.log('forEach====================');
      const number = index + 1 
  
      const arr_file = file.mimetype.split("/")
  
      let file_name = ''
  
      if(file.mimetype === 'image/jpeg' || file.mimetype === 'image/jpg' || file.mimetype === 'image/png'){
  
        file_name = 'img' + types + id + '_' + number + '.' + arr_file[1] 
  
      }else if(file.mimetype === 'application/pdf'){
  
        file_name = 'pdf' + types + id + '_' + number + '.' + arr_file[1] 
      }
  
      let filePath = null
      if(req.body.types === 'Complain'){
        filePath = __dirname + '/public/uploads/complain/' + file_name;
      }else if(req.body.types === 'ComplainStep'){
        filePath = __dirname + '/public/uploads/complain_step/' + file_name;
      }else{
        filePath = __dirname + '/public/uploads/corrupt/' + file_name;
      }
      // Use the mv() method to save each file to the server
      file.mv(filePath, (err) => {
        if (err) {
          return res.status(500).json({ error: 'Failed to upload files' });
        }
      });
    });
  }else{
    console.log('====================');
    const arr_file = files.mimetype.split("/")

    let file_name = ''

    if(files.mimetype === 'image/jpeg' || files.mimetype === 'image/jpg' || files.mimetype === 'image/png'){
  
      file_name = 'img' + types + id + '_' + '1' + '.' + arr_file[1] 

    }else if(files.mimetype === 'application/pdf'){

      file_name = 'pdf' + types + id + '_' + '1' + '.' + arr_file[1] 
    }
    let filePath = null

    if(types === 'Complain'){
      filePath = __dirname + '/public/uploads/complain/' + file_name;
    }else if(types === 'ComplainStep'){
      filePath = __dirname + '/public/uploads/complain_step/' + file_name;
    }else{
      filePath = __dirname + '/public/uploads/corrupt/' + file_name;
    }

    files.mv(filePath, (error) => {
      if (error) {
        console.error(error);
        return res.status(500).send('Error saving the file.');
      }

    });
   
  }


  res.json({ message: 'Files uploaded successfully' });

};