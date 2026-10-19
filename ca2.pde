import java.io.File;
import java.util.ArrayList;
import java.util.List;
import java.io.IOException;
import processing.core.PFont;
import processing.core.PVector;
import processing.core.PGraphics;
import oscP5.*;
import netP5.*;
import processing.data.XML;

// ! TERM.NAL — "./TrackpadOSC" !

// --- Constants and Parameters ---
int UNIVERSE_SIZE = 75;
float baseMutationRate = 50;
float mutationRateRange = 20;
float reproductionThreshold = (int) random(0.7, 7);
float interactionRadius = 20;
int GENE_MIN = -18;
int GENE_MAX = 18;
float CELL_RADIUS = 10;
float minRadius = 5;
float maxRadius = (int) random(50, 100);
int BACKGROUND_COLOR = color(255);
float FRAME_RATE = 60;
float baseMaxSpeed = 10f;
float maxSpeedVariation = 15f;
float energyConsumptionRate = 0.058f;
float energyGainFromInteraction = 0.004f;
float minEnergyForReproduction = .22;

// --- Metaball Parameters ---
float THRESHOLD = 0.2f;
float metaballStrength = 0.02f;

// --- Environmental Factors ---
float foodDensity = 0.025f;
float foodEnergyValue = 5.0f;
List<PVector> foodParticles = new ArrayList<>();

// --- Refresh Parameters ---
float minRefreshInterval = 10;
float maxRefreshInterval = 20;
float refreshInterval;
int lastRefreshTime;

// --- Speed Modification Zone ---
float slowDownRadius = 20;
float speedReductionFactor = 50.3f;

// --- Color Palette Change Parameters ---
int[] availableBackgroundColors = {
  color(233), color(22), color(255, 0, 0), color(0, 255, 0), color(0, 0, 255)
};
int backgroundColorIndex = 222;

int redColor = color(222, 0, 0);
int greenColor = color(0, 222, 0);
int blueColor = color(0, 0, 222);
float colorTransitionSpeed = 0.5f;

int targetBackgroundColor;
int targetRedColor, targetGreenColor, targetBlueColor;

// --- Cell Representation ---
class Cell {
  PVector position;
  PVector velocity;
  int gene;
  boolean alive;
  float radius;
  float energy;
  float mutationRate;
  float maxSpeed;
  float hostility;
  float speedModifier;
  float wanderStrength;

  Cell(float x, float y, int gene, float mutationRate) {
    this.position = new PVector(x, y);
    this.velocity = PVector.random2D();
    this.maxSpeed = baseMaxSpeed + random(-maxSpeedVariation, maxSpeedVariation);
    this.maxSpeed = max(0, this.maxSpeed);
    this.velocity.mult(this.maxSpeed);
    this.gene = gene;
    this.alive = true;
    this.radius = CELL_RADIUS;
    this.energy = 12;
    this.mutationRate = mutationRate;
    this.hostility = random(0, 1);
    this.speedModifier = random(0.7f, 2.3f);
    this.wanderStrength = random(0.01f, 0.05f);
  }

  void update() {
    if (alive) {
      float distanceToMouse = dist(position.x, position.y, mouseX, mouseY);
      float speedModifierMouse = 1.0f;
      if (distanceToMouse < slowDownRadius) {
        speedModifierMouse = speedReductionFactor;
      }

      velocity.add(PVector.random2D().mult(0.2f * speedModifierMouse));
      velocity.limit(this.maxSpeed * speedModifierMouse * this.speedModifier);

      applyOrganicInfluences(this);

      position.add(velocity);

      energy -= energyConsumptionRate;
      if (energy <= 0) {
        alive = false;
      }

      eatFood();

      if (position.x < containerX || position.x > containerX + containerWidth || position.y < containerY || position.y > containerY + containerHeight) {
        alive = false;
      }
    }
  }

  void interact(Cell other) {
    if (this == other || !this.alive || !other.alive) return;

    float distance = PVector.dist(this.position, other.position);

    if (distance < interactionRadius) {
      float influence = map(distance, 0, interactionRadius, 1, 0);
      int geneChange = int(influence * (other.gene - this.gene) * 0.1);

      float energyTransfer = energyGainFromInteraction * influence * (1 - abs(this.gene - other.gene) / (float)(GENE_MAX - GENE_MIN));
      this.energy += energyTransfer;
      other.energy -= energyTransfer;

      this.gene = constrain(this.gene + geneChange, GENE_MIN, GENE_MAX);
      other.gene = constrain(other.gene - geneChange, GENE_MIN, GENE_MAX);

      if (this.hostility > 0.5) {
        PVector away = PVector.sub(this.position, other.position);
        away.normalize();
        this.velocity.add(away.mult(0.05f * this.hostility));
      }

      if (distance < (this.radius + other.radius) && this.energy > minEnergyForReproduction && other.energy > minEnergyForReproduction) {
        reproduce(other);
      }

      PVector collisionNormal = PVector.sub(other.position, this.position).normalize();
      float overlap = (this.radius + other.radius) - distance;
      float separationAmount = overlap * 0.5f;

      this.position.sub(PVector.mult(collisionNormal, separationAmount));
      other.position.add(PVector.mult(collisionNormal, separationAmount));

      PVector thisVelocity = this.velocity.copy();
      PVector otherVelocity = other.velocity.copy();
      float thisDot = thisVelocity.dot(collisionNormal);
      float otherDot = otherVelocity.dot(collisionNormal);
      thisVelocity.sub(PVector.mult(collisionNormal, 2 * thisDot));
      otherVelocity.sub(PVector.mult(collisionNormal, 2 * otherDot));
      this.velocity.lerp(thisVelocity, 0.8f);
      other.velocity.lerp(otherVelocity, 0.8f);
      this.velocity.add(PVector.random2D().mult(0.3f));
      other.velocity.add(PVector.random2D().mult(0.3f));
    }
  }

  void reproduce(Cell other) {
    if (cells.size() < UNIVERSE_SIZE * 4 && this.hostility < 0.6 && other.hostility < 0.6) {
      float energyCost = (minEnergyForReproduction / 2) + 1;
      this.energy -= energyCost;
      other.energy -= energyCost;

      int newGene = (this.gene + other.gene) / 2;
      if (random(100) < this.mutationRate) {
        newGene = mutateGene(newGene);
      }

      float newMutationRate = constrain(this.mutationRate + random(-mutationRateRange, mutationRateRange), 0.5f, 20);

      PVector newPosition = PVector.add(this.position, other.position).div(2);
      newPosition.add(PVector.random2D().mult(this.radius));

      cells.add(new Cell(newPosition.x, newPosition.y, newGene, newMutationRate));
    }
  }

  int mutateGene(int gene) {
    float mutationRoll = random(1);
    int mutationAmount;

    if (mutationRoll < 0.26) {
      mutationAmount = (random(1) < 0.5) ? -1 : 1;
    } else if (mutationRoll < 0.9) {
      mutationAmount = (random(1) < 0.5) ? -2 : 2;
    } else {
      mutationAmount = (random(1) < 0.5) ? -3 : 3;
    }
    int newGene = gene + mutationAmount;
    return constrain(newGene, GENE_MIN, GENE_MAX);
  }

  void checkSurvival() {
    if (gene <= GENE_MIN || gene >= GENE_MAX) {
      alive = false;
    }
    int neighbors = 0;
    for (Cell other : cells) {
      if (other != this && other.alive && PVector.dist(this.position, other.position) < interactionRadius) {
        neighbors++;
      }
    }
    float lifespanBonus = neighbors * 0.5f;
    if (energy < lifespanBonus) {
      alive = false;
    }
  }

  void eatFood() {
    for (int i = foodParticles.size() - 1; i >= 0; i--) {
      PVector food = foodParticles.get(i);
      if (PVector.dist(position, food) < radius) {
        energy += foodEnergyValue;
        foodParticles.remove(i);
      }
    }
  }
}

ArrayList<Cell> cells;

// --- File Watching (Optional) ---
long lastModifiedTime;
String filePath = "/Users/gokcebalkan/Documents/Processing/rr2ll2ia3target11/rr2ll2ia3target11.pde";

// --- Font ---
PFont monoFont;

boolean hoveringCell = false;
int hoverColor = color(255);

// --- Axis Line Parameters ---
float fixedGapSize = 108; // minimum side gap of the horizontal line; the vertical line uses measured digit gaps (see drawAxisLines)

// --- Container Parameters ---
int cWHf = (int) random(7, 14);
int containerWidth;
int containerHeight;
int containerX;
int containerY;
float containerCornerRadius = 18.0f;

PGraphics container;

// ---NEW NOISE PARAMETERS ---
float noiseScale = 62.2;
float noiseStrength = 6;
float noiseTime = 30;

// --- Global: Number of cells that get out of bounds
int cellsOutOfBounds = 0;

OscP5 oscP5;
NetAddress myRemoteLocation;

int fingerCount = 0;

// --- Container Morphing ---
int targetContainerWidth, targetContainerHeight;
int easedContainerWidth, easedContainerHeight;
float containerMorphEase = 0.5f;

void setup() {
  fullScreen(P2D); // or P3D if you want 3D
  size(2560 / 2, 1600 / 2);
  // Calculate container position to center it
  containerX = (width - containerWidth) / 2;
  containerY = (height - containerHeight) / 2;

  container = createGraphics(containerWidth, containerHeight);
  easedContainerWidth = containerWidth;
  easedContainerHeight = containerHeight;

  frameRate(FRAME_RATE);
  smooth();
  randomizeSimulation();
  setNewRefreshInterval();
  lastRefreshTime = millis();

  lastModifiedTime = new File(filePath).lastModified();
  println("Watching file for changes: " + filePath);

  monoFont = createFont("Ca2-Thin", 202, true);

  cursor();
  targetBackgroundColor = BACKGROUND_COLOR;
  targetRedColor = redColor;
  targetGreenColor = greenColor;
  targetBlueColor = blueColor;

  noiseDetail(6);

  oscP5 = new OscP5(this, 9000);
}

// --- New Function: Randomize Simulation Parameters ---
void randomizeSimulation() {
  cells = new ArrayList<>();
  foodParticles.clear();
  cellsOutOfBounds = 0;

  UNIVERSE_SIZE = (int) random(1, random(20, 200));
  baseMutationRate = random(2, 8);
  mutationRateRange = random(1, 4);
  interactionRadius = random(10, 30);
  CELL_RADIUS = random(minRadius, maxRadius);

  for (int i = 0; i < UNIVERSE_SIZE; i++) {
    float initialMutationRate = baseMutationRate + random(-mutationRateRange, mutationRateRange);
    cells.add(new Cell(random(containerWidth) + containerX, random(containerHeight) + containerY, int(random(GENE_MIN, GENE_MAX + 1)), initialMutationRate));
  }

  for (int i = 0; i < containerWidth * containerHeight * foodDensity / 2; i++) {
    foodParticles.add(new PVector(random(containerWidth) + containerX, random(containerHeight) + containerY));
  }

  cWHf = (int) random(7, 8);
  targetContainerWidth = (((int) random(2) == 0) ? 5120 : 2160) / (cWHf+(int) random(-3.5, 1));
  targetContainerHeight = (((int) random(2) == 0) ? 5120 : 2160) / cWHf;

  println("Target Container Size set to: " + targetContainerWidth + "x" + targetContainerHeight);
}

void setNewRefreshInterval() {
  refreshInterval = random(minRefreshInterval, maxRefreshInterval);
  println("Next refresh in " + refreshInterval + " seconds.");
}

void draw() {
  long currentModifiedTime = new File(filePath).lastModified();
  if (currentModifiedTime > lastModifiedTime) {
    println("File has changed. Restart is highly recommended.");
    lastModifiedTime = currentModifiedTime;
  }

  BACKGROUND_COLOR = lerpColor(BACKGROUND_COLOR, targetBackgroundColor, colorTransitionSpeed);

  background(BACKGROUND_COLOR);

  int redCount = 0;
  int greenCount = 0;
  int blueCount = 0;
  for (Cell cell : cells) {
    if (cell.gene > 2) {
      redCount++;
    } else if (cell.gene < -2) {
      greenCount++;
    } else {
      blueCount++;
    }
  }

  int dominantColor = color(0);

  if (redCount > greenCount && redCount > blueCount) {
    dominantColor = color(255, 0, 0);
  } else if (greenCount > redCount && greenCount > blueCount) {
    dominantColor = color(0, 255, 0);
  } else if (blueCount > redCount && blueCount > greenCount) {
    dominantColor = color(0, 0, 255);
  }

  easedContainerWidth += (targetContainerWidth - easedContainerWidth) * containerMorphEase;
  easedContainerHeight += (targetContainerHeight - easedContainerHeight) * containerMorphEase;

  if (abs(easedContainerWidth - targetContainerWidth) < 0.1) {
    easedContainerWidth = targetContainerWidth;
  }

  if (abs(easedContainerHeight - targetContainerHeight) < 0.1) {
    easedContainerHeight = targetContainerHeight;
  }

  containerX = (width - (int) easedContainerWidth) / 2;
  containerY = (height - (int) easedContainerHeight) / 2;

  containerWidth = (int) easedContainerWidth;
  containerHeight = (int) easedContainerHeight;

  if (container != null) {
    container.dispose();
  }
  container = createGraphics(containerWidth, containerHeight);

  container.beginDraw();
  container.background(BACKGROUND_COLOR);

  if (random(1) < foodDensity && foodParticles.size() < containerWidth * containerHeight * foodDensity * 2) {
    foodParticles.add(new PVector(random(containerWidth), random(containerHeight)));
  }
  if (random(1) < 0.001 && foodParticles.size() > 0) {
    int randomIndex = (int) random(foodParticles.size());
    foodParticles.remove(randomIndex);
  }

  container.stroke(200, 100, 0);
  container.strokeWeight(1);

  for (PVector food : foodParticles) {
    container.point(food.x, food.y);
  }
  container.strokeWeight(12);
  container.noStroke();

  hoveringCell = false;
  hoverColor = color(255);
  int tempHoverColor = color(255);

  for (int i = cells.size() - 1; i >= 0; i--) {
    Cell cell = cells.get(i);
    cell.update();
    cell.checkSurvival();

    if (dist(mouseX, mouseY, cell.position.x, cell.position.y) < cell.radius && cell.position.x > containerX && cell.position.x < containerX + containerWidth && cell.position.y > containerY && cell.position.y < containerY + containerHeight) {
      hoveringCell = true;

      float redValue = 0;
      float greenValue = 0;
      float blueValue = 0;
      for (Cell otherCell : cells) {
        if (!otherCell.alive) continue;
        if (otherCell.position.x < containerX || otherCell.position.x > containerX + containerWidth || otherCell.position.y < containerY || otherCell.position.y > containerY + containerHeight) {
          continue;
        }
        float d = dist(containerX + mouseX - containerX, containerY + mouseY - containerY, otherCell.position.x, otherCell.position.y);
        float influence = metaballStrength * (cell.radius * cell.radius) / (d * d + 0.0001f);

        influence = pow(influence, 2);

        if (otherCell.gene > 2) {
          redValue += influence;
        } else if (otherCell.gene < -2) {
          greenValue += influence;
        } else {
          blueValue += influence;
        }
      }

      float totalColor = redValue + greenValue + blueValue;
      if (totalColor > 0) {
        redValue /= totalColor;
        greenValue /= totalColor;
        blueValue /= totalColor;
      }
      tempHoverColor = color(redValue * 255, greenValue * 255, blueValue * 255);

      container.stroke(0);
      container.strokeWeight(2);
      container.noFill();
      container.ellipse(cell.position.x - containerX, cell.position.y - containerY, cell.radius * 2, cell.radius * 2);
      container.noStroke();
    }

    for (int j = i - 1; j >= 0; j--) {
      cell.interact(cells.get(j));
    }

    if (!cell.alive) {
      cells.remove(i);
    }
  }
  if (hoveringCell) {
    hoverColor = tempHoverColor;
  }

  container.loadPixels();
  for (int x = 0; x < containerWidth; x++) {
    for (int y = 0; y < containerHeight; y++) {
      float sum = 0;
      float red = 0;
      float green = 0;
      float blue = 0;

      for (Cell cell : cells) {
        if (!cell.alive) continue;
        if (cell.position.x < containerX || cell.position.x > containerX + containerWidth || cell.position.y < containerY || cell.position.y > containerY + containerHeight) {
          continue;
        }
        float d = dist(containerX + x, containerY + y, cell.position.x, cell.position.y);
        float influence = metaballStrength * (cell.radius * cell.radius) / (d * d + 0.0001f);
        sum += influence;

        influence = pow(influence, 2);

        if (cell.gene > 2) {
          red += influence;
        } else if (cell.gene < -2) {
          green += influence;
        } else {
          blue += influence;
        }
      }

      if (sum > THRESHOLD) {
        float totalColor = red + green + blue;
        if (totalColor > 0) {
          red /= totalColor;
          green /= totalColor;
          blue /= totalColor;
        }

        float noiseValue = noise(x * noiseScale + noiseTime, y * noiseScale + noiseTime);

        red = constrain(red * 255 + map(noiseValue, 0, 1, -noiseStrength, noiseStrength), 0, 255);
        green = constrain(green * 255 + map(noiseValue, 0, 1, -noiseStrength, noiseStrength), 0, 255);
        blue = constrain(blue * 255 + map(noiseValue, 0, 1, -noiseStrength, noiseStrength), 0, 255);

        if (red + green + blue > THRESHOLD) {
          container.pixels[x + y * containerWidth] = color(red, green, blue);
        } else {
          container.pixels[x + y * containerWidth] = BACKGROUND_COLOR;
        }
      } else {
        container.pixels[x + y * containerWidth] = BACKGROUND_COLOR;
      }
    }
  }

  int cursorDotColor = color(getInvertedColor(mouseX, mouseY));
  int dotSize = 0;

  int centerX = containerWidth / 2;
  int centerY = containerHeight / 2;

  for (int x = -dotSize; x <= dotSize; x++) {
    for (int y = -dotSize; y <= dotSize; y++) {
      int pixelX = centerX + x;
      int pixelY = centerY + y;
      int pixelIndex = pixelX + pixelY * containerWidth;

      if (pixelX >= 0 && pixelX < containerWidth && pixelY >= 0 && pixelY < containerHeight) {
        if (pixelIndex >= 0 && pixelIndex < containerWidth * containerHeight) {
          container.pixels[pixelIndex] = cursorDotColor;
        }
      }
    }
  }

  container.updatePixels();

  noiseTime += 30;

  if (millis() - lastRefreshTime > refreshInterval * 1000) {
    println("Random refresh!");
    randomizeSimulation();
    setNewRefreshInterval();
    lastRefreshTime = millis();
  }

  redColor = lerpColor(redColor, targetRedColor, colorTransitionSpeed);
  greenColor = lerpColor(greenColor, targetGreenColor, colorTransitionSpeed);
  blueColor = lerpColor(blueColor, targetBlueColor, colorTransitionSpeed);

  for (Cell cell : cells) {
    if (cell.gene > 2) {
      redCount++;
    } else if (cell.gene < -2) {
      greenCount++;
    } else {
      blueCount++;
    }
  }


  if (redCount > greenCount && redCount > blueCount) {
    dominantColor = color(255, 0, 0);
  } else if (greenCount > redCount && greenCount > blueCount) {
    dominantColor = color(0, 255, 0);
  } else if (blueCount > redCount && blueCount > greenCount) {
    dominantColor = color(0, 0, 255);
  }

  displayCellInformation();

  stroke(dominantColor);
  strokeWeight(2);
  noFill();
  rect(containerX, containerY, containerWidth, containerHeight, containerCornerRadius);

  drawAxisLines();
  image(container, containerX, containerY);

  updateCursor();
}

void drawAxisLines() {
  strokeWeight(1);

  String mouseXString = "" + mouseX;
  float mouseXWidth = textWidth(mouseXString);
  String dcc2 = "" + cells.size();
  float dcc = textWidth(dcc2);

  float dynamicGapRight = max(fixedGapSize, mouseXWidth + 15);
  float dynamicGapLeft = max(fixedGapSize, dcc + 15);

  float diagonalLineLengthFactor = 0.75;

  // --- Vertical line ends: gap to the top/bottom numbers == horizontal line's gap to the side numbers ---
  float baseW = 2560, baseH = 1600;
  float hs = height / baseH;
  float ws = width / baseW;
  float fontPx = 210 * min(ws, hs);
  textFont(monoFont, fontPx);
  float glyphScale = fontPx / monoFont.getSize();
  float digitTopAbove = 0;
  float digitBottomAbove = 1e9;
  for (char ch = '0'; ch <= '9'; ch++) {
    PFont.Glyph g = monoFont.getGlyph(ch);
    if (g == null) continue;
    digitTopAbove = max(digitTopAbove, g.topExtent * glyphScale);
    digitBottomAbove = min(digitBottomAbove, (g.topExtent - g.height) * glyphScale);
  }
  if (digitBottomAbove > 1e8) digitBottomAbove = 0;
  float topDigitsBottomY = 2 * hs + textAscent() - digitBottomAbove;
  float bottomDigitsTopY = (baseH + 27) * hs - textDescent() - digitTopAbove;
  // ink edges of the side numbers (advance width minus side bearings)
  PFont.Glyph lastG = monoFont.getGlyph(dcc2.charAt(dcc2.length() - 1));
  PFont.Glyph firstG = monoFont.getGlyph(mouseXString.charAt(0));
  float leftNumberRightX = 12 * ws + dcc;
  if (lastG != null) leftNumberRightX = 12 * ws + dcc - lastG.setWidth * glyphScale + (lastG.leftExtent + lastG.width) * glyphScale;
  float rightNumberLeftX = (baseW + 6) * ws - mouseXWidth;
  if (firstG != null) rightNumberLeftX += firstG.leftExtent * glyphScale;
  float gapLeftH = dynamicGapLeft - leftNumberRightX;
  float gapRightH = rightNumberLeftX - (width - dynamicGapRight);
  float sideGap = max(0, min(gapLeftH, gapRightH));
  float vLineTop = topDigitsBottomY + sideGap;
  float vLineBottom = bottomDigitsTopY - sideGap;

  PGraphics axisLines = createGraphics(width, height);
  axisLines.beginDraw();
  axisLines.stroke(50);
  axisLines.strokeWeight(1.5);
  axisLines.line(dynamicGapLeft, axisLines.height / 2, axisLines.width - dynamicGapRight, axisLines.height / 2);
  axisLines.line(axisLines.width / 2, vLineTop, axisLines.width / 2, vLineBottom);

  float centerX = axisLines.width / 2;
  float centerY = axisLines.height / 2;

  float bottomLeftX = 0;
  float bottomLeftY = axisLines.height;
  float bottomLeftXAdjusted = lerp(centerX, bottomLeftX, diagonalLineLengthFactor);
  float bottomLeftYAdjusted = lerp(centerY, bottomLeftY, diagonalLineLengthFactor);

  axisLines.line(centerX, centerY, bottomLeftXAdjusted, bottomLeftYAdjusted);

  float bottomRightX = axisLines.width;
  float bottomRightY = axisLines.height;
  float bottomRightXAdjusted = lerp(centerX, bottomRightX, diagonalLineLengthFactor);
  float bottomRightYAdjusted = lerp(centerY, bottomRightY, diagonalLineLengthFactor);

  axisLines.line(centerX, centerY, bottomRightXAdjusted, bottomRightYAdjusted);

  axisLines.endDraw();
  axisLines.noFill();

  for (int x = 0; x < axisLines.width; x++) {
    for (int y = 0; y < axisLines.height; y++) {
      if (
        (y >= axisLines.height / 2 - 0.4 && y <= axisLines.height / 2 && x >= dynamicGapLeft && x <= axisLines.width - dynamicGapRight) ||
        (x >= axisLines.width / 2 - 0.4 && x <= axisLines.width / 2 && y >= vLineTop && y <= vLineBottom) ||
        (isNearLine(x, y, centerX, centerY, bottomLeftXAdjusted, bottomLeftYAdjusted)) ||
        (isNearLine(x, y, centerX, centerY, bottomRightXAdjusted, bottomRightYAdjusted))
        ) {
        color targetTotalColor, targetTitleColor, targetCoorColor;
        color targetRedColor, targetGreenColor, targetBlueColor;
        color targetAxisColor;

        if (hoveringCell) {
          targetTotalColor = hoverColor;
          targetTitleColor = getInvertedColor(mouseX, mouseY);
          targetCoorColor = hoverColor;
          targetAxisColor = hoverColor;
          targetRedColor = hoverColor;
          targetGreenColor = hoverColor;
          targetBlueColor = hoverColor;
        } else {
          targetTotalColor = getInvertedColor(mouseX, mouseY);
          targetCoorColor = color(getInvertedColor(mouseX, mouseY), 50);
          targetTitleColor = color(getInvertedColor(mouseX, mouseY), 222);
          targetAxisColor = color(getInvertedColor(mouseX, mouseY), 30);
          targetRedColor = color(255, 0, 0);
          targetGreenColor = color(0, 255, 0);
          targetBlueColor = color(0, 0, 255);
        }

        easedTotalColor = lerpColor(easedTotalColor, targetTotalColor, easeFactor);
        easedTitleColor = lerpColor(easedTitleColor, targetTitleColor, easeFactor);
        easedCoorColor = lerpColor(easedCoorColor, targetCoorColor, easeFactor);
        easedAxisColor = lerpColor(easedAxisColor, targetAxisColor, easeFactor);
        easedRedColor = lerpColor(easedRedColor, targetRedColor, easeFactor);
        easedGreenColor = lerpColor(easedGreenColor, targetGreenColor, easeFactor);
        easedBlueColor = lerpColor(easedBlueColor, targetBlueColor, easeFactor);
        set(x, y, easedAxisColor);
      }
    }
  }

  image(axisLines, 0, 0);
}

boolean isNearLine(float px, float py, float x1, float y1, float x2, float y2) {
  float d = distToSegment(px, py, x1, y1, x2, y2);
  return d < 0.5;
}

float distToSegment(float px, float py, float x1, float y1, float x2, float y2) {
  float dx = x2 - x1;
  float dy = y2 - y1;

  if (dx == 0 && dy == 0) {
    return dist(px, py, x1, y1);
  }

  float t = ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy);

  if (t < 0) {
    return dist(px, py, x1, y1);
  } else if (t > 1) {
    return dist(px, py, x2, y2);
  } else {
    float x = x1 + t * dx;
    float y = y1 + t * dy;
    return dist(px, py, x, y);
  }
}

color easedTotalColor, easedTitleColor, easedCoorColor;
color easedRedColor, easedGreenColor, easedBlueColor;
color easedAxisColor;
float easeFactor = 0.3;

void displayCellInformation() {
  textFont(monoFont);

  int redCount = 0;
  int greenCount = 0;
  int blueCount = 0;
  int totalCells = 0;

  for (Cell cell : cells) {
    totalCells++;
    if (cell.gene > 2) {
      redCount++;
    } else if (cell.gene > 2) {
      redCount++;
    } else if (cell.gene < -2) {
      greenCount++;
    } else {
      blueCount++;
    }
  }

  // --- Base Resolution (Adjust if needed!) ---
  float baseWidth = 2560/1;
  float baseHeight = 1600/1;

  // --- Original, Fixed-Size Values (from your original code) ---
  float originalTextSize = 210; // Assuming this represents your ideal text size
  float originalLeftMargin = 12;
  float originalRightMargin = baseWidth + 6;
  float originalTopMargin = 2;
  float originalCenterY = baseHeight / 2.012;  //Vertical Centerline
  float originalBottomTextOffset = baseHeight - -27; //Bottom Y offset

  // --- Calculate Scaling Factors ---
  float widthScale = width / baseWidth;
  float heightScale = height / baseHeight;
  float textScale = min(widthScale, heightScale); // Scale the text and other elements
                                                  // proportionately

  // --- Apply Scaling Factors ---
  float dynamicTextSize = originalTextSize * textScale;
  textFont(monoFont, dynamicTextSize);

  float leftMargin = originalLeftMargin * widthScale;
  float rightMargin = originalRightMargin * widthScale;
  float topMargin = originalTopMargin * heightScale;
  float centerY = originalCenterY * heightScale;
  float bottomTextOffset = originalBottomTextOffset * heightScale;

  // --- Draw the Text ---
  fill(easedTitleColor);
  textAlign(LEFT, TOP);
  text("CELYLAR", leftMargin, topMargin);

  fill(easedTitleColor);
  textAlign(RIGHT, TOP);
  text("AUTOMW", rightMargin, topMargin);

  fill(easedCoorColor);
  textAlign(CENTER, TOP);
  text("" + mouseY, width / 2, topMargin);

  fill(easedCoorColor);
  textAlign(RIGHT, CENTER);
  text(mouseX + "", rightMargin, centerY);

  fill(easedTotalColor);
  textAlign(LEFT, CENTER);
  text("" + totalCells, leftMargin, centerY);

  fill(easedBlueColor);
  textAlign(RIGHT, BOTTOM);
  text("" + blueCount, rightMargin, bottomTextOffset);

  fill(easedRedColor);
  textAlign(LEFT, BOTTOM);
  text("" + redCount, leftMargin, bottomTextOffset);

  fill(easedGreenColor);
  textAlign(CENTER, BOTTOM);
  text("" + greenCount, width / 2, bottomTextOffset);
}

void shiftColors() {
  int tempRed = targetRedColor;
  targetRedColor = targetGreenColor;
  targetGreenColor = targetBlueColor;
  targetBlueColor = tempRed;

  println("Cell colors shifting.");
}

void oscEvent(OscMessage theOscMessage) {
  if (theOscMessage.checkAddrPattern("/trackpad")) {
    String xmlString = theOscMessage.get(0).stringValue();

    XML xml = null;
    try {
      xml = XML.parse(xmlString);
    } catch (IOException e) {
      println("IOException parsing XML: " + e.getMessage());
      println("XML String that caused the error: " + xmlString);
      e.printStackTrace();
      return;
    } catch (Exception e) {
      println("Exception parsing XML: " + e.getMessage());
      println("XML String that caused the error: " + xmlString);
      e.printStackTrace();
      return;
    }

    if (xml != null) {
      XML[] fingers = xml.getChildren("finger");
      fingerCount = (fingers != null) ? fingers.length : 0;
      println("Finger Count: " + fingerCount);
    } else {
      println("Error parsing XML: (XML is null)" + xmlString);
    }
  }
}

void mouseClicked() {
  if (fingerCount == 1) {
    killCellsNearMouse();
    println("One-finger tap : Killed cells near mouse.");

  } else if (fingerCount == 2) {
    int cellsToCreate = (int)random(1, 6);
    for (int i = 0; i < cellsToCreate; i++) {
      createNewCell();
    }
    println("Two-finger tap: Added cells.");

  } else if (fingerCount == 3) {
    cycleBackgroundColor();
    println("Three-finger tap: Changed background color and container size.");

  } else if (fingerCount == 4) {
    randomizeSimulation();
    println("Four-finger tap: Randomized simulation.");

  } else {
    if (keyPressed) {
      if (key == 'b' || key == 'B') {
        cycleBackgroundColor();
        println("Background color cycled (B key pressed).");

      } else if (key == 'a' || key == 'A') {
        createNewCell();
        println("Simulation randomized (C key pressed).");

      } else if (key == 's' || key == 'S') {
        randomizeSimulation();
        println("Simulation randomized (C key pressed).");

      } else if (key == 'd' || key == 'D') {
        killCellsNearMouse();
        println("Cells was killed near mouse.(D key pressed).");

      } else {
        println("Key pressed, but no action assigned.");

      }
    } else {
      int action = (int) random(0, 8);
      switch (action) {
      case 0:
        createNewCell();
        break;
      case 1:
        changeRefreshInterval();
        break;
      case 2:
        changeInteractionRadius();
        break;
      case 3:
        randomizeSingleParameter();
        break;
      case 4:
        killCellsNearMouse();
        break;
      case 5:
        cycleBackgroundColor();
        break;
      case 6:
        randomizeSimulation();
        break;
      case 7:
        randomizeSimulation();
        break;
      case 22:
        shiftColors();
        break;
      }
    }
  }
}

void changeContainerSize() {
    cWHf = (int) random(7, 14);
    targetContainerWidth = (((int)random(2) == 0) ? 5120 : 2160) / cWHf;
    targetContainerHeight = (((int)random(2) == 0) ? 3840 : 1620) / cWHf;

    println("New target container size: " + targetContainerWidth + "x" + targetContainerHeight);
}

void createNewCell() {
  float initialMutationRate = baseMutationRate + random(-mutationRateRange, mutationRateRange);
  cells.add(new Cell(mouseX, mouseY, int(random(GENE_MIN, GENE_MAX + 1)), initialMutationRate));
  println("New cell created at mouse position.");
}

void changeRefreshInterval() {
  setNewRefreshInterval();
  lastRefreshTime = millis();
  println("Refresh interval changed by click.");
}

void changeInteractionRadius() {
  interactionRadius = random(10, 50);
  println("Interaction radius changed to: " + interactionRadius);
}

void randomizeSingleParameter() {
  int parameterToChange = (int) random(0, 5);

  switch (parameterToChange) {
  case 0:
    baseMutationRate = random(2, 8);
    println("Base Mutation Rate changed to: " + baseMutationRate);
    break;
  case 1:
    mutationRateRange = random(1, 4);
    println("Mutation Rate Range changed to: " + mutationRateRange);
    break;
  case 2:
    CELL_RADIUS = random(minRadius, maxRadius);
    println("Cell Radius changed to: " + CELL_RADIUS);
    break;
  case 3:
    baseMaxSpeed = random(1, 2);
    println("Base Max Speed changed to: " + baseMaxSpeed);
    break;
  case 4:
    foodDensity = random(0.01f, 0.05f);
    println("Food Density changed to: " + foodDensity);
    break;
  }
}

void killCellsNearMouse() {
  float killRadius = 22;
  for (int i = cells.size() - 1; i >= 0; i--) {
    Cell cell = cells.get(i);
    if (dist(mouseX, mouseY, cell.position.x, cell.position.y) < killRadius) {
      cells.remove(i);
    }
  }
  println("Killed cells near the mouse.");
}

void cycleBackgroundColor() {
  backgroundColorIndex = (backgroundColorIndex + 1) % availableBackgroundColors.length;
  targetBackgroundColor = availableBackgroundColors[backgroundColorIndex];
}

int lerpColor(int c1, int c2, float amt) {
  float r1 = red(c1);
  float g1 = green(c1);
  float b1 = blue(c1);
  float a1 = alpha(c1);

  float r2 = red(c2);
  float g2 = green(c2);
  float b2 = blue(c2);
  float a2 = alpha(c2);

  return color(lerp(r1, r2, amt), lerp(g1, g2, amt), lerp(b1, b2, amt), lerp(a1, a2, amt));
}

int getInvertedColorArea(int x, int y) {
  int sumRed = 0;
  int sumGreen = 0;
  int sumBlue = 0;
  int sampleCount = 0;

  for (int i = -1; i <= 1; i++) {
    for (int j = -1; j <= 1; j++) {
      int sampleX = x + i;
      int sampleY = y + j;

      if (sampleX >= 0 && sampleX < width && sampleY >= 0 && sampleY < height) {
        int currentColor = get(sampleX, sampleY);
        sumRed += red(currentColor);
        sumGreen += green(currentColor);
        sumBlue += blue(currentColor);
        sampleCount++;
      }
    }
  }

  int avgRed = (sampleCount > 0) ? 255 - (sumRed / sampleCount) : 0;
  int avgGreen = (sampleCount > 0) ? 255 - (sumGreen / sampleCount) : 0;
  int avgBlue = (sampleCount > 0) ? 255 - (sumBlue / sampleCount) : 0;

  return color(avgRed, avgGreen, avgBlue);
}

int getInvertedColor(int x, int y) {
  int currentColor = get(x, y);
  return color(255 - red(currentColor), 255 - green(currentColor), 255 - blue(currentColor));
}

PGraphics cursorImage;
float lastCellRadius = -444;

float targetCursorScale = 1.0f;
float currentCursorScale = 1.0f;
float cursorScaleEase = 0.75f;

void mousePressed() {
  targetCursorScale = 3.5f;
  currentCursorScale = 3.5f;
}

void mouseReleased() {
  targetCursorScale = 1.0f;
}

void updateCursor() {
  currentCursorScale += (targetCursorScale - currentCursorScale) * cursorScaleEase;

  if (CELL_RADIUS != lastCellRadius) {
    lastCellRadius = CELL_RADIUS;
    int cellDiameter = (int) (CELL_RADIUS * 2);
    cursorImage = createGraphics(cellDiameter, cellDiameter);
  }

  if (hoveringCell) {
    int cellDiameter = (int) (CELL_RADIUS * 2);
    cursorImage.beginDraw();
    cursorImage.background(0, 0);
    cursorImage.noFill();
    cursorImage.strokeWeight(1);

    cursorImage.loadPixels();

    int cursorDotColor = getInvertedColorArea(mouseX, mouseY);
    cursorImage.fill(red(cursorDotColor), green(cursorDotColor), blue(cursorDotColor));
    cursorImage.noStroke();

    for (int x = 0; x < cellDiameter; x++) {
      for (int y = 0; y < cellDiameter; y++) {
        float d = dist(x, y, cellDiameter / 2, cellDiameter / 2);

        if (d <= cellDiameter / 5 && d > cellDiameter / 5 - 0.9) {
          int currentColor = getInvertedColorArea(mouseX - cellDiameter / 2 + x, mouseY - cellDiameter / 2 + y);
          cursorImage.pixels[x + y * cellDiameter] = currentColor;
        } else {
          cursorImage.pixels[x + y * cellDiameter] = color(0, 0);
        }
      }
    }

    cursorImage.updatePixels();

    cursorImage.pushMatrix();
    cursorImage.translate(cellDiameter / 2, cellDiameter / 2);
    cursorImage.scale(currentCursorScale);
    cursorImage.ellipse(0, 0, 0.5, 0.5);
    cursorImage.popMatrix();

    cursorImage.endDraw();

    cursor(cursorImage.get());
  } else {
    cursor();
  }
}

void applyOrganicInfluences(Cell cell) {
    int aliveNeighbors = 0;
    for (Cell other : cells) {
        if (other != cell && other.alive && PVector.dist(cell.position, other.position) < interactionRadius) {
            aliveNeighbors++;
        }
    }

    float lifeInfluence = 0;
    if (cell.alive) {
        if (aliveNeighbors < 2 || aliveNeighbors > 3) {
            lifeInfluence = -0.005f;
        } else {
            lifeInfluence = 1.0025f;
        }
    } else {
        if (aliveNeighbors == 3) {
            lifeInfluence = 1.005f;
        } else {
            lifeInfluence = -0.0025f;
        }
    }

    float brainInfluence = 0;
    if (aliveNeighbors == 2) {
        brainInfluence = 0.008f;
    }

    float rule90Influence = 0;
    Cell leftNeighbor = null;
    Cell rightNeighbor = null;

    for (Cell other : cells) {
        if (other != cell && other.alive && PVector.dist(cell.position, other.position) < interactionRadius) {
            if (other.position.x < cell.position.x && (leftNeighbor == null || other.position.x > leftNeighbor.position.x)) {
                leftNeighbor = other;
            }
            if (other.position.x > cell.position.x && (rightNeighbor == null || other.position.x < rightNeighbor.position.x)) {
                rightNeighbor = other;
            }
        }
    }

    int leftState = (leftNeighbor != null && leftNeighbor.alive) ? 1 : 0;
    int rightState = (rightNeighbor != null && rightNeighbor.alive) ? 1 : 0;

    if ((leftState ^ rightState) == 1) {
        rule90Influence = 0.0025f;
    }

    PVector influenceDirection = PVector.random2D();

    float totalInfluence = lifeInfluence + brainInfluence + rule90Influence + random(-0.1f, 0.1f);
    influenceDirection.mult(totalInfluence);

    cell.velocity.add(influenceDirection);
    cell.velocity.lerp(PVector.random2D().mult(cell.maxSpeed), 0.04f);
    cell.velocity.limit(cell.maxSpeed);
}
