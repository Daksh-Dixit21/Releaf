from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse
from PIL import Image
import easyocr
import google.generativeai as genai
import spacy
import io
import os

app = FastAPI()

# Configure the Generative AI
api_key = "AIzaSyCEOVQfuI7EkvXceJkbxO3GBYJvi9ISm94"
genai.configure(api_key=api_key)
model = genai.GenerativeModel("gemini-1.5-flash")

# Initialize EasyOCR reader
reader = easyocr.Reader(['en'], gpu=False)

# Load spaCy NLP model
nlp = spacy.load("en_core_web_sm")

non_biodegradable_keywords = [
                             "plastic", "polystyrene", "nylon", "PVC", "polymer", "long-lasting", "durable", "won't decompose", "resistant to decomposition", "non-biodegradable","preservatives", "chemical preservatives", "synthetic acids",
                              "synthetic additives", "artificial preservatives", "plasticizers", "synthetic dyes", "non-natural flavors", "chemical stabilizers", "artificial sweeteners", "emulsifiers", "binding agents",
                                "synthetic coatings", "industrial chemicals", "environmentally harmful", "non-eco-friendly", "synthetic fragrances", "artificial scents", "chemically formulated",
                               "toxic materials", "hazardous chemicals", "chemical-laden products", "harmful agents", "synthetic oils", "environmentally damaging", "industrial contaminants", "mayonnaise"
                               "Bisphenol A (BPA)", "phthalates", "perfluoroalkyl substances (PFAS)", "polychlorinated biphenyls (PCBs)", "heavy metals", "parabens", "formaldehyde", "sodium benzoate", "potassium bromate", "artificial flavors",
                                "high fructose corn syrup", "monosodium glutamate (MSG)", "sodium nitrate", "artificial food colors", "trans fats", "saccharin", "cyclamate", "aspartame", "acesulfame potassium", "sodium lauryl sulfate",
                               "triclosan", "dioxin", "chlorofluorocarbons (CFCs)", "polyvinyl chloride (PVC)", "phthalate esters", "polyethylene terephthalate (PET)", "polychloroprene", "chlorine", "bromine", "fluorine",
                                "endocrine disruptors", "carcinogenic", "toxic", "harmful", "non-organic", "hazardous", "bioaccumulative", "persistent organic pollutants", "mutagenic", "teratogenic", "neurotoxic", "allergenic", "toxin accumulation", "toxin exposure", "environmental hazard", "non-biodegradable packaging",
                                "synthetic polymers", "plastic microbeads", "pesticide residues", "herbicide residues", "chemical spills", "hazardous waste", "industrial waste", "non-recyclable plastics", "plastic waste", "pollutants",
                                "chemical leaching", "synthetic fibers", "nylon fibers", "polyester fibers", "petroleum-based products", "synthetic fabrics", "chemically produced", "man-made chemicals", "non-decomposable", "hard plastics", "soft plastics",
                               "synthetic resins", "chemical contaminants", "toxic chemicals", "synthetic compounds", "artificial materials", "non-decomposing materials", "persistent toxins", "resistant materials", "non-biodegradable waste",
                              "environmental pollution", "chemical byproducts", "industrial chemicals", "harmful substances", "bioaccumulative toxins", "toxin build-up", "persistent pollutants", "non-natural substances", "artificial compounds", "synthetic products",
                               "environmentally unfriendly", "plastic additives", "artificial polymers", "chemical pollutants", "non-renewable resources", "toxic additives", "persistent plastics", "chemical-intensive", "environmental contaminants", "hazardous materials",
                              "synthetic herbicides", "non-compostable materials", "industrial pollutants", "chemical coatings", "environmental contaminants", "chemical-laden", "synthetic pesticides","chemically treated", "persistent residues", "toxic residues", "harmful emissions", "environmentally persistent", "non-renewable",
]

def is_non_biodegradable(text):
    return any(keyword.lower() in text.lower() for keyword in non_biodegradable_keywords)

def preprocess_text(text):
    doc = nlp(text)
    filtered_words = [token.lemma_ for token in doc if not token.is_stop and not token.is_punct]
    return " ".join(filtered_words)

@app.post("/ocr/upload/")
async def upload_image(file: UploadFile = File(...)):
    try:
        # Load the uploaded image
        image_data = await file.read()
        image = Image.open(io.BytesIO(image_data))

        # Perform OCR
        result = reader.readtext(image_data, detail=0)
        extracted_text = ' '.join(result)

        # Preprocess the extracted text
        cleaned_text = preprocess_text(extracted_text)
        print(f"Cleaned Text: {cleaned_text}")

        # Build prompt for Gemini
        prompt = f"""
You are an expert in food sustainability and disaster relief planning.

Based on the extracted information from the product label below, provide brief and practical bullet-point answers to these questions:

1. What is the estimated shelf life of a product like this, both unopened and after being opened or left unpackaged? Base your answer on any ingredients, preservatives, or packaging clues.
2. Could this product be useful in disaster or emergency situations (e.g., floods, earthquakes, refugee camps)? If so, how?
3. What are any potential concerns or limitations when storing or using this product in such scenarios?

Extracted Product Information:
\"\"\"{cleaned_text}\"\"\"

Keep the answers concise, actionable, and written for a relief website.
"""


        # Generate content using Generative AI
        try:
            response = model.generate_content(prompt)
            print(f"Generated Response: {response.text}")
            generated_text = response.text

            biodegradable_status = "Non-biodegradable" if is_non_biodegradable(generated_text) else "Biodegradable"

            return JSONResponse(content={
                "filename": file.filename,
                "extracted_text": extracted_text,
                "cleaned_text": cleaned_text,
                "generated_response": generated_text,
                "status": biodegradable_status
            })
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error during Generative AI processing: {str(e)}")

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing image: {str(e)}")
