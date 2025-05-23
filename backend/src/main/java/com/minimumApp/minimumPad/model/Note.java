package com.minimumApp.minimumPad.model;

import com.amazonaws.services.dynamodbv2.datamodeling.*;
import lombok.Data;

@Data
@DynamoDBTable(tableName = "notes")
public class Note {

    @DynamoDBHashKey(attributeName = "id")
    @DynamoDBAutoGeneratedKey
    private String id;

    @DynamoDBAttribute(attributeName = "userId")
    private String userId;

    @DynamoDBAttribute(attributeName = "title")
    private String title;

    @DynamoDBAttribute(attributeName = "content")
    private String content;
}
